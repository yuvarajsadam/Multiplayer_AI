const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, default: 'system' },
  activeRole: { type: String, default: 'Coder AI' },
  currentDraftPrompt: { type: String, default: '' },
  isPrivate: { type: Boolean, default: false },
  inviteCode: { type: String, default: null },
  maxUsers: { type: Number, default: 20 },
  users: [
    {
      id: String,
      name: String,
      email: String,
      socketId: String,
      color: String,
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
