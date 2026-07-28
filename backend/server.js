require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { connectDB } = require('./config/db');
const { register, login, getMe, getUsageStats } = require('./controllers/authController');
const { createRoom, joinRoom, getUserRooms, deleteRoom, getRoomDetails, getRoomHistory } = require('./controllers/roomController');
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/authMiddleware');
const { authLimiter, apiLimiter, aiLimiter } = require('./middleware/rateLimiter');
const socketAuthMiddleware = require('./sockets/socketAuth');

const registerPresenceHandlers = require('./sockets/presenceHandler');
const registerRoomHandlers = require('./sockets/roomHandler');
const registerChatHandlers = require('./sockets/chatHandler');

const app = express();
const server = http.createServer(app);

// CORS configuration for REST & WebSockets (handles trailing slashes & custom domains)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://multiplayer-ai-black.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean).map(url => url.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const clientUrlClean = (process.env.CLIENT_URL || '').replace(/\/$/, '');

    if (
      cleanOrigin === clientUrlClean ||
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

// Apply General Rate Limiter to all API routes
app.use('/api', apiLimiter);

// Initialize Database connection
connectDB();

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', saas: true, timestamp: new Date() });
});

// Authentication Routes (Rate Limited)
app.post('/api/auth/register', authLimiter, register);
app.post('/api/auth/login', authLimiter, login);
app.get('/api/auth/me', authMiddleware, getMe);
app.get('/api/usage/stats', authMiddleware, getUsageStats);

// Multi-Room REST Routes
app.post('/api/rooms/create', optionalAuthMiddleware, createRoom);
app.post('/api/rooms/join', optionalAuthMiddleware, joinRoom);
app.get('/api/rooms/my-rooms', authMiddleware, getUserRooms);
app.delete('/api/rooms/:roomId', authMiddleware, deleteRoom);
app.get('/api/rooms/:roomId', getRoomDetails);
app.get('/api/rooms/:roomId/history', getRoomHistory);

// WebSocket Engine Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
});

// Bind Socket JWT Authentication Middleware
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`[Socket SaaS] Client connected: ${socket.id} (User: ${socket.user?.name || 'Guest'})`);

  // Register Handlers
  registerPresenceHandlers(io, socket);
  registerRoomHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`[Socket SaaS] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Multiplayer AI Workspace SaaS Backend running on port ${PORT}`);
  console.log(`🔐 JWT Authentication & Rate Limiting active`);
  console.log(`⚡ Socket.io real-time engine active with handshake auth`);
  console.log(`=======================================================`);
});
