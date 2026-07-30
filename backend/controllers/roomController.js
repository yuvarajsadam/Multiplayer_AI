const Room = require('../models/Room');
const Message = require('../models/Message');
const { getIsConnected } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// In-Memory fallback store for rooms & messages when MongoDB is offline
const memoryStore = {
  rooms: new Map(),
  messages: new Map()
};

// Seed default demo-room in memoryStore
memoryStore.rooms.set('demo-room', {
  roomId: 'demo-room',
  name: 'Default Shared Room',
  ownerId: 'system',
  activeRole: 'Coder AI',
  currentDraftPrompt: '',
  users: [],
  createdAt: new Date()
});
memoryStore.messages.set('demo-room', []);

const createRoom = async (req, res) => {
  try {
    const { name = 'Collaborative AI Workspace', isPrivate = false } = req.body;
    const ownerId = req.user?.id || 'system';
    const roomId = uuidv4().substring(0, 8); // e.g. 'a1b2c3d4'

    const roomData = {
      roomId,
      name,
      ownerId,
      activeRole: 'Coder AI',
      currentDraftPrompt: '',
      isPrivate,
      users: [],
      createdAt: new Date()
    };

    if (getIsConnected()) {
      const room = new Room(roomData);
      await room.save();
    } else {
      memoryStore.rooms.set(roomId, roomData);
      memoryStore.messages.set(roomId, []);
    }

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: roomData
    });
  } catch (error) {
    console.error('[Create Room Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId, userName } = req.body;
    if (!roomId) {
      return res.status(400).json({ success: false, error: 'roomId is required' });
    }

    let room = null;
    if (getIsConnected()) {
      room = await Room.findOne({ roomId });
      if (!room && roomId === 'demo-room') {
        const defaultRoomData = {
          roomId: 'demo-room',
          name: 'Default Shared Room',
          ownerId: 'system',
          activeRole: 'Coder AI',
          currentDraftPrompt: '',
          users: [],
          createdAt: new Date()
        };
        room = new Room(defaultRoomData);
        await room.save();
      }
    } else {
      room = memoryStore.rooms.get(roomId);
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found. Please verify the room code or create a new room.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      room: {
        roomId: room.roomId,
        name: room.name,
        ownerId: room.ownerId,
        activeRole: room.activeRole,
        currentDraftPrompt: room.currentDraftPrompt
      }
    });
  } catch (error) {
    console.error('[Join Room Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getUserRooms = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let rooms = [];
    if (getIsConnected()) {
      rooms = await Room.find({
        $or: [
          { ownerId: userId },
          { 'users.id': userId }
        ]
      }).sort({ createdAt: -1 });
    } else {
      rooms = Array.from(memoryStore.rooms.values()).filter(r => r.ownerId === userId || r.users.some(u => u.id === userId));
    }

    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    if (getIsConnected()) {
      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
      if (room.ownerId !== userId) {
        return res.status(403).json({ success: false, error: 'Only the room owner can delete this room' });
      }

      await Room.deleteOne({ roomId });
      await Message.deleteMany({ roomId });
    } else {
      const room = memoryStore.rooms.get(roomId);
      if (room && room.ownerId === userId) {
        memoryStore.rooms.delete(roomId);
        memoryStore.messages.delete(roomId);
      }
    }

    return res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    let room = null;

    if (getIsConnected()) {
      room = await Room.findOne({ roomId });
    } else {
      room = memoryStore.rooms.get(roomId);
    }

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    return res.status(200).json({ success: true, room });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getRoomHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    let history = [];

    if (getIsConnected()) {
      history = await Message.find({ roomId }).sort({ timestamp: 1 });
    } else {
      history = memoryStore.messages.get(roomId) || [];
    }

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('[Get History Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getUserRooms,
  deleteRoom,
  getRoomDetails,
  getRoomHistory,
  memoryStore
};
