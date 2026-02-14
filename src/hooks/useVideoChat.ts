import { useState, useEffect, useRef, useCallback } from 'react';
import { getGlobalSocket } from './useGlobalSocket';

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

interface UseVideoReturns {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  partner: Partner | null;
  queuePosition: number;
  error: string | null;
  messages: Message[];
  isWaiting: boolean;
  isMatchingInProgress: boolean;
  sendMessage: (message: string) => void;
  stopChat: () => void;
  setError: (error: string | null) => void;
  setPartnerData: (partner: Partner, initiator: boolean) => Promise<void>;
}

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ]
};

export const useVideoChat = (): UseVideoReturns => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isMatchingInProgress, setIsMatchingInProgress] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isInitiatorRef = useRef(false);

  const createPeerConnection = useCallback(async () => {
    try {
      console.log('🔧 Creating peer connection...');

      if (peerConnectionRef.current) {
        console.log('Closing existing peer connection');
        peerConnectionRef.current.close();
      }

      if (!localStreamRef.current) {
        console.log('🎥 Requesting media...');
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

        localStreamRef.current = stream;
        setLocalStream(stream);
        console.log('✅ Media acquired:', stream.getTracks().map(t => t.kind));
      }

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      console.log('➕ Adding local tracks to peer connection...');
      localStreamRef.current!.getTracks().forEach(track => {
        console.log(`  Adding ${track.kind} track:`, track.id);
        pc.addTrack(track, localStreamRef.current!);
      });

      pc.ontrack = (event) => {
        console.log('🎥 Received remote track:', event.track.kind, 'Track ID:', event.track.id);
        console.log('   Stream ID:', event.streams[0]?.id);
        
        const stream = event.streams[0];
        console.log('   Remote stream tracks:', stream.getTracks().map(t => `${t.kind}:${t.id}`));
        
        setRemoteStream(stream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate:', event.candidate.type);
          const socket = getGlobalSocket();
          if (socket) {
            socket.emit('ice-candidate', { candidate: event.candidate });
          }
        } else {
          console.log('🧊 All ICE candidates sent');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('❄️ ICE connection state:', pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ Peer connection fully established');
          setError(null);
        } else if (pc.connectionState === 'failed') {
          console.error('❌ Peer connection failed');
          setError('Connection failed');
        } else if (pc.connectionState === 'disconnected') {
          console.warn('⚠️ Peer connection disconnected');
        }
      };

      pc.onsignalingstatechange = () => {
        console.log('📡 Signaling state:', pc.signalingState);
      };

      console.log('✅ Peer connection created successfully');

    } catch (err) {
      console.error('❌ Error in createPeerConnection:', err);
      setError('Failed to setup video connection: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket || !socket.connected) {
      setError('Socket not connected');
      return;
    }

    console.log('📱 VideoChat component mounted, socket:', socket.id);
    setIsConnected(true);

    const handleWaiting = (data: { queuePosition: number }) => {
      console.log('⏳ User in queue, position:', data.queuePosition);
      setQueuePosition(data.queuePosition);
      setIsWaiting(true);
    };

    const handleMatched = async (data: { partner: Partner; initiator: boolean }) => {
      console.log('🎉 MATCHED with partner:', data.partner);
      isInitiatorRef.current = data.initiator;
      setPartner(data.partner);
      setIsWaiting(false);
      setIsMatchingInProgress(false);
      setMessages([]);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));
      await createPeerConnection();
      
      if (data.initiator && peerConnectionRef.current) {
        console.log('📤 Creating offer as initiator...');
        try {
          const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('offer', { offer });
          console.log('✅ Offer sent');
        } catch (err) {
          console.error('Error creating offer:', err);
          setError('Failed to create connection offer');
        }
      }
    };

    const handleOffer = async (data: { offer: RTCSessionDescriptionInit }) => {
      console.log('📥 Received offer');
      try {
        if (!peerConnectionRef.current) {
          console.log('Creating peer connection for offer');
          await createPeerConnection();
        }

        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer', { answer });
          console.log('✅ Answer sent');
        }
      } catch (err) {
        console.error('Error handling offer:', err);
        setError('Failed to establish connection');
      }
    };

    const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log('📥 Received answer');
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('✅ Connection established');
        }
      } catch (err) {
        console.error('Error handling answer:', err);
        setError('Failed to establish connection');
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    const handleChatMessage = (data: { message: string; from: string; timestamp: number }) => {
      console.log('💬 Received message from:', data.from);
      setMessages(prev => [...prev, {
        text: data.message,
        sender: data.from,
        isSent: false,
        timestamp: data.timestamp
      }]);
    };

    const handlePartnerDisconnected = () => {
      console.log('😔 Partner disconnected');
      setError('Your partner has disconnected');
      closePeerConnection();
      setPartner(null);
      setIsWaiting(true);
      setIsMatchingInProgress(false);
    };

    socket.on('waiting', handleWaiting);
    socket.on('matched', handleMatched);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('chat-message', handleChatMessage);
    socket.on('partner-disconnected', handlePartnerDisconnected);

    return () => {
      socket.off('waiting', handleWaiting);
      socket.off('matched', handleMatched);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('chat-message', handleChatMessage);
      socket.off('partner-disconnected', handlePartnerDisconnected);
    };
  }, [createPeerConnection]);

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

  const sendMessage = useCallback((message: string) => {
    const socket = getGlobalSocket();
    if (socket && message.trim()) {
      console.log('💬 Sending message:', message);
      socket.emit('chat-message', message);
      setMessages(prev => [...prev, {
        text: message,
        sender: 'You',
        isSent: true,
        timestamp: Date.now()
      }]);
    }
  }, []);

  const setPartnerData = useCallback(async (partnerData: Partner, initiator: boolean) => {
    console.log('🎯 setPartnerData called - Partner:', partnerData, 'Initiator:', initiator);
    
    isInitiatorRef.current = initiator;
    setPartner(partnerData);
    setIsMatchingInProgress(false);
    setIsWaiting(false);
    setMessages([]);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 800)); 
    
    await createPeerConnection();
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (initiator && peerConnectionRef.current) {
      console.log('📤 Creating offer as initiator...');
      try {
        const offer = await peerConnectionRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        
        console.log('📤 Offer created:', offer.type);
        await peerConnectionRef.current.setLocalDescription(offer);
        console.log('📤 Local description set');

        const socket = getGlobalSocket();
        if (socket) {
          socket.emit('offer', { offer });
          console.log('✅ Offer sent to server');
        }
      } catch (err) {
        console.error('❌ Error creating offer:', err);
        setError('Failed to create connection offer');
      }
    } else {
      console.log('⏳ Waiting for offer (not initiator)');
    }
  }, [createPeerConnection]);

  const stopChat = useCallback(() => {
    const socket = getGlobalSocket();
    closePeerConnection();
    if (socket) {
      socket.emit('stop');
    }
    setPartner(null);
    setIsWaiting(false);
    setIsMatchingInProgress(false);
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
    isMatchingInProgress,
    sendMessage,
    stopChat,
    setError,
    setPartnerData
  };
};