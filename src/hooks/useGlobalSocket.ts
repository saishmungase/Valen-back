import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

let globalSocket: Socket | null = null;
const connectionListeners = new Set<(connected: boolean) => void>();

export const useGlobalSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(globalSocket);

  useEffect(() => {
    if (globalSocket) {
      setSocket(globalSocket);
      setIsConnected(globalSocket.connected);
      return;
    }

    const newSocket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('✅ Global socket connected:', newSocket.id);
      setIsConnected(true);
      connectionListeners.forEach(listener => listener(true));
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Global socket disconnected');
      setIsConnected(false);
      connectionListeners.forEach(listener => listener(false));
    });

    globalSocket = newSocket;
    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
    };
  }, []);

  const onConnectionChange = (callback: (connected: boolean) => void) => {
    connectionListeners.add(callback);
    return () => {
      connectionListeners.delete(callback);
    };
  };

  return {
    socket,
    isConnected,
    onConnectionChange
  };
};

export const getGlobalSocket = (): Socket | null => {
  return globalSocket;
};
