import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthUser } from './useAuth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const useUserPresence = (user: AuthUser | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Presence registered:', user.name);
      
      socket.emit('register-presence', {
        name: user.name,
        age: 25, 
        gender: 'other',
        interests: user.interests || [],
        values: user.values || [],
        personalityTags: user.personalityTags || [],
        bio: user.bio || `Hi, I'm ${user.name}!`,
        country: user.country || 'Unknown',
        flag: user.country === 'South Korea' ? '🇰🇷' : 
              user.country === 'United States' ? '🇺🇸' : 
              user.country === 'Brazil' ? '🇧🇷' : 
              user.country === 'Germany' ? '🇩🇪' : 
              user.country === 'UAE' ? '🇦🇪' : '🌍',
        mode: user.mode || 'friendship'
      });
    });

    socket.on('disconnect', () => {
      console.log('Presence disconnected:', user.name);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return socketRef.current;
};
