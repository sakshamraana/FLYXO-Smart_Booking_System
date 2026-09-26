import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketIo = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketIo.on('connect', () => {
      console.log('[SocketContext] Connected to real-time server');
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('[SocketContext] Disconnected from real-time server');
      setIsConnected(false);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  const joinShowRoom = (showId) => {
    if (socket) {
      socket.emit('joinShowRoom', showId);
    }
  };

  const leaveShowRoom = (showId) => {
    if (socket) {
      socket.emit('leaveShowRoom', showId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinShowRoom, leaveShowRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
