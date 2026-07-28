const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints (prevent brute-force logins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General REST API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per IP
  message: {
    success: false,
    error: 'Rate limit exceeded. Please slow down your requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI Execution Rate Limiter
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 AI executions per minute per IP
  message: {
    success: false,
    error: 'AI prompt rate limit exceeded. Max 30 prompts per minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter, aiLimiter };
