import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to server (using configured environment URL or relative origin)
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      window.location.origin;

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('user:connect', user._id);
    });

    newSocket.on('users:online', (userIds) => {
      setOnlineUsers(userIds || []);
    });

    newSocket.on('user:offline', (offlineUserId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== offlineUserId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?._id]);

  const joinProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('project:join', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('project:leave', projectId);
    }
  };

  const joinChat = (roomKey) => {
    if (socket && roomKey) {
      socket.emit('chat:join', roomKey);
    }
  };

  const leaveChat = (roomKey) => {
    if (socket && roomKey) {
      socket.emit('chat:leave', roomKey);
    }
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId.toString());
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isUserOnline,
        joinProject,
        leaveProject,
        joinChat,
        leaveChat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
