const User = require('../models/User');
const Usage = require('../models/Usage');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getIsConnected } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// In-Memory store fallback for auth when MongoDB is disconnected
const inMemoryUsers = new Map();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarColor: user.avatarColor || '#3B82F6',
      tier: user.tier || 'free'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, avatarColor = '#3B82F6' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const userId = 'usr_' + uuidv4().substring(0, 8);

    if (getIsConnected()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'User with this email already exists' });
      }

      const newUser = new User({
        id: userId,
        name,
        email: email.toLowerCase(),
        password,
        avatarColor,
        tier: 'free',
        monthlyTokenQuota: 100000,
        tokensUsed: 0,
        promptsExecuted: 0
      });

      await newUser.save();
      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatarColor: newUser.avatarColor,
          tier: newUser.tier,
          monthlyTokenQuota: newUser.monthlyTokenQuota,
          tokensUsed: newUser.tokensUsed,
          promptsExecuted: newUser.promptsExecuted
        }
      });
    } else {
      if (inMemoryUsers.has(email.toLowerCase())) {
        return res.status(400).json({ success: false, error: 'User already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const memUser = {
        id: userId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        avatarColor,
        tier: 'free',
        monthlyTokenQuota: 100000,
        tokensUsed: 0,
        promptsExecuted: 0
      };

      inMemoryUsers.set(email.toLowerCase(), memUser);
      const token = generateToken(memUser);

      const { password: _, ...userWithoutPassword } = memUser;

      return res.status(201).json({
        success: true,
        message: 'Registered successfully (Memory mode)',
        token,
        user: userWithoutPassword
      });
    }
  } catch (error) {
    console.error('[Register Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (getIsConnected()) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor,
          tier: user.tier,
          monthlyTokenQuota: user.monthlyTokenQuota,
          tokensUsed: user.tokensUsed,
          promptsExecuted: user.promptsExecuted
        }
      });
    } else {
      const user = inMemoryUsers.get(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully (Memory mode)',
        token,
        user: userWithoutPassword
      });
    }
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (getIsConnected()) {
      const user = await User.findOne({ id: req.user.id }).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.status(200).json({ success: true, user });
    } else {
      const user = Array.from(inMemoryUsers.values()).find(u => u.id === req.user.id);
      return res.status(200).json({
        success: true,
        user: user || {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          tier: 'free',
          monthlyTokenQuota: 100000,
          tokensUsed: 0,
          promptsExecuted: 0
        }
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getUsageStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let logs = [];
    if (getIsConnected()) {
      logs = await Usage.find({ userId }).sort({ timestamp: -1 }).limit(20);
    }

    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getUsageStats
};
