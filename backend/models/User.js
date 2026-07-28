const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatarColor: { type: String, default: '#3B82F6' },
  tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  monthlyTokenQuota: { type: Number, default: 100000 },
  tokensUsed: { type: Number, default: 0 },
  promptsExecuted: { type: Number, default: 0 },
  socketId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Password Hash Pre-Save Hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
