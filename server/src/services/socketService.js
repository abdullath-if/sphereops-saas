const { Server } = require('socket.io');

let io = null;
const onlineUsers = new Map(); // userId -> Set of socketIds

const initSocket = (server, clientUrl) => {
  const allowedOrigins = clientUrl
    ? clientUrl
        .split(',')
        .map((u) => u.trim())
        .concat(['http://localhost:5173', 'http://127.0.0.1:5173'])
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // User registers connection
    socket.on('user:connect', (userId) => {
      if (!userId) return;
      socket.userId = userId;

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Join a personal room for targeted alerts
      socket.join(`user:${userId}`);

      // Broadcast list of currently online user IDs
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`[Socket] User ${userId} connected on socket ${socket.id}`);
    });

    // Project room subscription
    socket.on('project:join', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on('project:leave', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Chat room subscription
    socket.on('chat:join', (roomKey) => {
      if (roomKey) {
        socket.join(`chat:${roomKey}`);
      }
    });

    socket.on('chat:leave', (roomKey) => {
      if (roomKey) {
        socket.leave(`chat:${roomKey}`);
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ roomKey, userName }) => {
      socket.to(`chat:${roomKey}`).emit('typing:status', { roomKey, userName, isTyping: true });
    });

    socket.on('typing:stop', ({ roomKey, userName }) => {
      socket.to(`chat:${roomKey}`).emit('typing:status', { roomKey, userName, isTyping: false });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      if (socket.userId && onlineUsers.has(socket.userId)) {
        const userSockets = onlineUsers.get(socket.userId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId);
          io.emit('user:offline', socket.userId);
        }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    return {
      emit: () => {},
      to: () => ({ emit: () => {} }),
    };
  }
  return io;
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = { initSocket, getIO, getOnlineUsers };
