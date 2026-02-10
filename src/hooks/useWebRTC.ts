import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UserData {
  name: string;
  age: number;
  gender: string;
}

interface Partner {
  name: string;
  age: number;
}

interface Message {
  text: string;
  sender: string;
  isSent: boolean;
  timestamp: number;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  partner: Partner | null;
  queuePosition: number;
  error: string | null;
  messages: Message[];
  isWaiting: boolean;
  joinChat: (userData: UserData) => void;
  sendMessage: (message: string) => void;
  stopChat: () => void;
  setError: (error: string | null) => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export const useWebRTC = (): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isInitiatorRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('waiting', (data: { queuePosition: number }) => {
      setQueuePosition(data.queuePosition);
      setIsWaiting(true);
    });

    socket.on('matched', async (data: { partner: Partner; initiator: boolean }) => {
      console.log('Matched with partner:', data);
      isInitiatorRef.current = data.initiator;
      setPartner(data.partner);
      setIsWaiting(false);
      setMessages([]);

      // Small delay to ensure both peers are ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await createPeerConnection();

      if (isInitiatorRef.current && peerConnectionRef.current) {
        try {
          console.log('Creating offer as initiator');
          const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('offer', { offer });
          console.log('Offer sent');
        } catch (err) {
          console.error('Error creating offer:', err);
          setError('Failed to create connection offer');
        }
      }
    });

    socket.on('offer', async (data: { offer: RTCSessionDescriptionInit }) => {
      console.log('Received offer');
      try {
        if (!peerConnectionRef.current) {
          console.log('No peer connection, creating one');
          await createPeerConnection();
        }
        
        if (peerConnectionRef.current) {
          console.log('Setting remote description');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          console.log('Creating answer');
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer', { answer });
          console.log('Answer sent');
        }
      } catch (err) {
        console.error('Error handling offer:', err);
        setError('Failed to handle connection offer');
      }
    });

    socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log('Received answer');
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } catch (err) {
        console.error('Error handling answer:', err);
        setError('Failed to handle connection answer');
      }
    });

    socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('chat-message', (data: { message: string; from: string; timestamp: number }) => {
      console.log('Received chat message:', data);
      setMessages(prev => [...prev, {
        text: data.message,
        sender: data.from,
        isSent: false,
        timestamp: data.timestamp
      }]);
    });

    socket.on('partner-disconnected', () => {
      setError('Your partner has disconnected. Finding a new match...');
      closePeerConnection();
      setPartner(null);
      setIsWaiting(true);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      closePeerConnection();
      socket.disconnect();
    };
  }, []);

  const createPeerConnection = async () => {
    try {
      console.log('Creating peer connection...');
      
      // Close existing connection if any
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      // Request media if we don't have it
      if (!localStreamRef.current) {
        console.log('Requesting media access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        console.log('Media access granted');
        localStreamRef.current = stream;
        setLocalStream(stream);
      }

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      console.log('Adding local tracks to peer connection');
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding track:', track.kind);
        pc.addTrack(track, localStreamRef.current!);
      });

      // Handle remote stream
      const remoteStreamObj = new MediaStream();
      setRemoteStream(remoteStreamObj);

      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        event.streams[0].getTracks().forEach(track => {
          console.log('Adding remote track to stream:', track.kind);
          remoteStreamObj.addTrack(track);
        });
        // Force update
        setRemoteStream(new MediaStream(remoteStreamObj.getTracks()));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log('Sending ICE candidate');
          socketRef.current.emit('ice-candidate', { candidate: event.candidate });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('Peer connection established!');
          setError(null);
        } else if (pc.connectionState === 'failed') {
          setError('Connection failed. Please try again.');
        }
      };

      console.log('Peer connection created successfully');

    } catch (err) {
      console.error('Error creating peer connection:', err);
      setError('Failed to access camera/microphone. Please allow permissions.');
    }
  };

  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setRemoteStream(null);
  };

  const joinChat = useCallback((userData: UserData) => {
    if (socketRef.current) {
      // Send full user data including profile information
      socketRef.current.emit('join', {
        ...userData,
        interests: [],
        values: [],
        personalityTags: [],
        bio: `Hi, I'm ${userData.name}!`,
        country: 'Unknown',
        flag: '🌍',
        mode: 'friendship'
      });
      setIsWaiting(true);
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && message.trim()) {
      console.log('Sending message:', message);
      socketRef.current.emit('chat-message', message);
      setMessages(prev => [...prev, {
        text: message,
        sender: 'You',
        isSent: true,
        timestamp: Date.now()
      }]);
    } else {
      console.log('Cannot send message - socket not connected or message empty');
    }
  }, []);

  const stopChat = useCallback(() => {
    closePeerConnection();
    if (socketRef.current) {
      socketRef.current.emit('stop');
    }
    setPartner(null);
    setIsWaiting(true);
    setMessages([]);
  }, []);

  return {
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
