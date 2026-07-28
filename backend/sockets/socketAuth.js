const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    // For anonymous/demo connections, assign an guest user profile instead of crashing
    socket.user = {
      id: 'guest_' + socket.id.substring(0, 6),
      name: 'Guest Engineer',
      email: 'guest@ai-workspace.local',
      tier: 'free',
      isGuest: true
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      avatarColor: decoded.avatarColor || '#3B82F6',
      color: decoded.avatarColor || '#3B82F6',
      tier: decoded.tier || 'free',
      isGuest: false
    };
    next();
  } catch (err) {
    console.warn(`[Socket Auth Warning] Invalid JWT token for socket ${socket.id}. Fallback to guest.`);
    socket.user = {
      id: 'guest_' + socket.id.substring(0, 6),
      name: 'Guest Engineer',
      email: 'guest@ai-workspace.local',
      tier: 'free',
      isGuest: true
    };
    next();
  }
};

module.exports = socketAuthMiddleware;
