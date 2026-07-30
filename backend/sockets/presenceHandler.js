const Room = require('../models/Room');
const { getIsConnected } = require('../config/db');
const { memoryStore } = require('../controllers/roomController');

// Active socket state tracking: socketId -> { userId, userName, color, roomId }
const activeSockets = new Map();
// Live typing tracker: roomId -> Map(userId -> { userName, isTyping, updatedAt })
const typingState = new Map();

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
  '#EF4444', '#EC4899', '#06B6D4', '#6366F1'
];

const registerPresenceHandlers = (io, socket) => {

  // Event: join_room
  socket.on('join_room', async ({ roomId, user }) => {
    if (!roomId || !user || !user.name) return;

    let room = null;
    if (getIsConnected()) {
      try {
        room = await Room.findOne({ roomId });
      } catch (err) {
        console.error('[Presence DB Error]', err.message);
      }
    }
    if (!room) {
      room = memoryStore.rooms.get(roomId);
    }

    if (!room) {
      if (roomId === 'demo-room') {
        const defaultRoom = { roomId: 'demo-room', name: 'Default Shared Room', activeRole: 'Coder AI', currentDraftPrompt: '', users: [] };
        if (getIsConnected()) {
          try {
            room = new Room(defaultRoom);
            await room.save();
          } catch (e) {
            memoryStore.rooms.set('demo-room', defaultRoom);
            room = defaultRoom;
          }
        } else {
          memoryStore.rooms.set('demo-room', defaultRoom);
          room = defaultRoom;
        }
      } else {
        socket.emit('room_error', { roomId, error: 'Room does not exist' });
        return;
      }
    }

    // Room is verified! Now join socket room.
    socket.join(roomId);

    const color = user.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    const userPayload = {
      id: user.id || socket.id,
      name: user.name,
      socketId: socket.id,
      color: color,
      joinedAt: new Date()
    };

    activeSockets.set(socket.id, { ...userPayload, roomId });

    // Update room users
    if (room.save && typeof room.save === 'function') {
      try {
        room.users = (room.users || []).filter(u => u.id !== userPayload.id && u.socketId !== socket.id);
        room.users.push(userPayload);
        await room.save();
      } catch (err) {
        console.error('[Presence Save DB Error]', err.message);
      }
    } else {
      room.users = (room.users || []).filter(u => u.id !== userPayload.id && u.socketId !== socket.id);
      room.users.push(userPayload);
    }

    const roomUsers = room.users;

    // Broadcast user joined to room
    io.to(roomId).emit('user_joined', {
      user: userPayload,
      activeUsers: roomUsers
    });

    // Send current room state (active role, current draft prompt) to joining user
    const roomState = getIsConnected() 
      ? await Room.findOne({ roomId }).lean()
      : memoryStore.rooms.get(roomId);

    if (roomState) {
      socket.emit('room_state', {
        activeRole: roomState.activeRole || 'Coder AI',
        currentDraftPrompt: roomState.currentDraftPrompt || ''
      });
    }
  });

  // Event: typing
  socket.on('typing', ({ roomId, isTyping, user }) => {
    if (!roomId) return;

    if (!typingState.has(roomId)) {
      typingState.set(roomId, new Map());
    }
    const roomTypingMap = typingState.get(roomId);

    if (isTyping && user) {
      roomTypingMap.set(user.id || socket.id, {
        id: user.id || socket.id,
        name: user.name,
        color: user.color
      });
    } else {
      roomTypingMap.delete(user?.id || socket.id);
    }

    const currentTypingUsers = Array.from(roomTypingMap.values());
    socket.to(roomId).emit('typing', { typingUsers: currentTypingUsers });
  });

  // Event: disconnect / leave
  socket.on('disconnect', async () => {
    const userInfo = activeSockets.get(socket.id);
    if (!userInfo) return;

    const { roomId, id: userId, name: userName } = userInfo;
    activeSockets.delete(socket.id);

    // Remove from typing state
    if (typingState.has(roomId)) {
      typingState.get(roomId).delete(userId);
      socket.to(roomId).emit('typing', { typingUsers: Array.from(typingState.get(roomId).values()) });
    }

    // Remove user from Room DB or Memory store
    let roomUsers = [];
    if (getIsConnected()) {
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          room.users = room.users.filter(u => u.socketId !== socket.id && u.id !== userId);
          await room.save();
          roomUsers = room.users;
        }
      } catch (err) {
        console.error('[Presence Disconnect DB Error]', err.message);
      }
    } else {
      const room = memoryStore.rooms.get(roomId);
      if (room) {
        room.users = room.users.filter(u => u.socketId !== socket.id && u.id !== userId);
        roomUsers = room.users;
      }
    }

    socket.to(roomId).emit('user_left', {
      userId,
      userName,
      activeUsers: roomUsers
    });
  });
};

module.exports = registerPresenceHandlers;
