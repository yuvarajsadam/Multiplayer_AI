const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  usageId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  role: { type: String, default: 'Coder AI' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usage', usageSchema);
