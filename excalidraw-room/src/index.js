const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

// Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Store active rooms and their users
const rooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Excalidraw Collaboration Server', status: 'running' });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    console.log(`User ${socket.id} joining room: ${roomId}`);
    
    // Leave any previous rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        updateRoomUsers(room);
      }
    });

    // Join the new room
    socket.join(roomId);
    socket.roomId = roomId;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    // Add user to room
    rooms.get(roomId).add(socket.id);

    // Notify room about new user
    socket.to(roomId).emit('new-user', socket.id);
    
    // Send current room users to the new user
    updateRoomUsers(roomId);
    
    // Emit init-room to the joining user
    socket.emit('init-room');
  });

  // Handle server messages (encrypted scene data)
  socket.on('server', (roomId, encryptedData, iv) => {
    socket.to(roomId).emit('client', encryptedData, iv);
  });

  // Handle volatile server messages (cursor movements, etc.)
  socket.on('server-volatile', (roomId, encryptedData, iv) => {
    socket.volatile.to(roomId).emit('client-volatile', encryptedData, iv);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(socket.roomId);
        } else {
          updateRoomUsers(socket.roomId);
        }
      }
    }
  });

  function updateRoomUsers(roomId) {
    const room = rooms.get(roomId);
    if (room) {
      const userIds = Array.from(room);
      io.to(roomId).emit('room-user-change', userIds);
    }
  }
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`Excalidraw collaboration server running on port ${PORT}`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});