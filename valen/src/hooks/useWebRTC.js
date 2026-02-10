import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

export const useWebRTC = (serverUrl = 'http://localhost:5000') => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partner, setPartner] = useState(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false);
  
  const peerConnectionRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null); // Store pending offer
  const pendingCandidatesRef = useRef([]); // Store pending ICE candidates

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('waiting', (data) => {
      console.log('Waiting in queue:', data);
      setQueuePosition(data.queuePosition);
      setIsWaiting(true);
    });

    newSocket.on('matched', async (data) => {
      console.log('Matched with partner:', data);
      isInitiatorRef.current = data.initiator;
      setPartner(data.partner);
      setMessages([]);
      setIsWaiting(false);
      
      try {
        // Get camera access FIRST
        let stream = localStreamRef.current;
        if (!stream) {
          console.log('Requesting camera access...');
          stream = await getUserMedia();
          localStreamRef.current = stream;
        }
        
        // Create peer connection with the stream
        console.log('Creating peer connection...');
        await createPeerConnection(newSocket, stream);
        
        // Process pending offer if any (for non-initiator)
        if (!data.initiator && pendingOfferRef.current) {
          console.log('Processing pending offer');
          await handleOffer(pendingOfferRef.current, newSocket);
          pendingOfferRef.current = null;
        }
        
        // Process pending ICE candidates
        if (pendingCandidatesRef.current.length > 0) {
          console.log('Processing', pendingCandidatesRef.current.length, 'pending ICE candidates');
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
        }
        
        // If initiator, create and send offer
        if (data.initiator) {
          console.log('Creating offer as initiator...');
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          newSocket.emit('offer', { offer });
          console.log('Offer sent');
        }
      } catch (err) {
        console.error('Failed to setup connection:', err);
        setError('Failed to access camera or setup connection.');
      }
    });

    newSocket.on('offer', async (data) => {
      console.log('Received offer');
      
      // If peer connection not ready, store the offer
      if (!peerConnectionRef.current) {
        console.log('Peer connection not ready, storing offer');
        pendingOfferRef.current = data;
        return;
      }
      
      await handleOffer(data, newSocket);
    });

    newSocket.on('answer', async (data) => {
      console.log('Received answer');
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('Answer processed');
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    newSocket.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate');
      
      // If peer connection not ready, store the candidate
      if (!peerConnectionRef.current) {
        console.log('Peer connection not ready, storing ICE candidate');
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }
      
      try {
        if (data.candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          console.log('ICE candidate added');
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    newSocket.on('chat-message', (data) => {
      setMessages((prev) => [
        ...prev,
        { text: data.message, sender: data.from, isSent: false, timestamp: data.timestamp }
      ]);
    });

    newSocket.on('partner-disconnected', () => {
      setError('Your partner has disconnected');
      closePeerConnection();
      setPartner(null);
      setRemoteStream(null);
      setIsWaiting(true);
      pendingOfferRef.current = null;
      pendingCandidatesRef.current = [];
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl]);

  // Handle offer
  const handleOffer = async (data, socketInstance) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        console.log('Remote description set');
        
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketInstance.emit('answer', { answer });
        console.log('Answer sent');
      }
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  // Get user media
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setLocalStream(stream);
      console.log('Got local stream:', stream.id);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      
      let errorMsg = 'Failed to access camera/microphone';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera/microphone access denied. Please allow permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera or microphone found.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera is already in use. Please close other tabs/apps using it.';
      }
      
      setError(errorMsg);
      throw err;
    }
  };

  // Create peer connection with stream
  const createPeerConnection = async (socketInstance, stream) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      
      // Add local stream tracks to peer connection
      if (stream) {
        stream.getTracks().forEach((track) => {
          console.log('Adding track to peer connection:', track.kind);
          pc.addTrack(track, stream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('🎥 Received remote track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          console.log('✅ Setting remote stream:', event.streams[0].id);
          setRemoteStream(event.streams[0]);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketInstance) {
          socketInstance.emit('ice-candidate', { candidate: event.candidate });
          console.log('📤 ICE candidate sent');
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ WebRTC connection established!');
        }
        if (pc.connectionState === 'failed') {
          setError('Connection failed. Please try again.');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState);
      };

      peerConnectionRef.current = pc;
      console.log('✅ Peer connection created and ready');
    } catch (err) {
      console.error('Error creating peer connection:', err);
      setError('Failed to create peer connection');
    }
  };

  // Close peer connection
  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
  };

  // Join chat
  const joinChat = async (userData) => {
    if (!socket) {
      setError('Not connected to server');
      return;
    }

    try {
      setError(null);
      socket.emit('join', userData);
      setIsWaiting(true);
    } catch (err) {
      setError('Failed to join chat');
    }
  };

  // Send message
  const sendMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('chat-message', message);
      setMessages((prev) => [
        ...prev,
        { text: message, sender: 'You', isSent: true, timestamp: Date.now() }
      ]);
    }
  };

  // Stop/Next
  const stopChat = () => {
    closePeerConnection();
    if (socket) {
      socket.emit('stop');
    }
    setPartner(null);
    setMessages([]);
    setIsWaiting(true);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      closePeerConnection();
    };
  }, []);

  return {
    socket,
    localStream,
    remoteStream,
    isConnected,
    partner,
    queuePosition,
    error,
    messages,
    isWaiting,
    joinChat,
    sendMessage,
    stopChat,
    setError
  };
};