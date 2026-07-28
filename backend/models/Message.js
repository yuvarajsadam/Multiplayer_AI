const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  prompt: { type: String, required: true },
  response: { type: String, default: '' },
  role: { type: String, default: 'Coder AI' },
  author: {
    id: String,
    name: String
  },
  timestamp: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  roomId: { type: String, required: true, index: true },
  prompt: { type: String, required: true },
  response: { type: String, default: '' },
  role: { type: String, default: 'Coder AI' },
  author: {
    id: String,
    name: String,
    color: String
  },
  version: { type: Number, default: 1 },
  versions: [versionSchema],
  votes: {
    upvotes: [{ type: String }],
    downvotes: [{ type: String }]
  },
  isStreaming: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
