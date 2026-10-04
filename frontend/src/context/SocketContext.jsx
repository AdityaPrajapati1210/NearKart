import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Connect through origin proxy (/socket.io) to ensure cookies are sent seamlessly
    const socketHost = window.location.origin;

    const newSocket = io(socketHost, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      auth: {
        userId: user?._id || user?.id,
        role: user?.role,
        riderId: user?.role === 'delivery' ? (user?._id || user?.id) : undefined,
      },
      query: {
        userId: user?._id || user?.id,
        role: user?.role,
      },
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected successfully:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('🔌 Socket connection issue:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, user?.role]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
