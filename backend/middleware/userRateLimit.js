const rateLimit = require('express-rate-limit');
const { supabaseAdmin } = require('../config/supabase');

// In-memory store for user rate limiting (in production, use Redis)
const userRateLimitStore = new Map();

// Custom store for user-based rate limiting
const userRateLimitStoreAdapter = {
  incr: (key) => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const windowStart = Math.floor(now / windowMs) * windowMs;
    
    if (!userRateLimitStore.has(key)) {
      userRateLimitStore.set(key, { count: 1, resetTime: windowStart + windowMs });
      return Promise.resolve({ totalHits: 1, resetTime: windowStart + windowMs });
    }
    
    const record = userRateLimitStore.get(key);
    
    // Reset if window has passed
    if (now >= record.resetTime) {
      userRateLimitStore.set(key, { count: 1, resetTime: windowStart + windowMs });
      return Promise.resolve({ totalHits: 1, resetTime: windowStart + windowMs });
    }
    
    // Increment count
    record.count++;
    userRateLimitStore.set(key, record);
    return Promise.resolve({ totalHits: record.count, resetTime: record.resetTime });
  },
  
  decrement: (key) => {
    const record = userRateLimitStore.get(key);
    if (record && record.count > 0) {
      record.count--;
      userRateLimitStore.set(key, record);
    }
    return Promise.resolve();
  },
  
  resetKey: (key) => {
    userRateLimitStore.delete(key);
    return Promise.resolve();
  }
};

// User-based rate limiter for authenticated routes
const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for authenticated users in company environment
  message: 'Too many requests from this user, please try again later.',
  keyGenerator: (req) => {
    // Use user ID for rate limiting instead of IP
    return req.user ? req.user.id : req.ip;
  },
  store: userRateLimitStoreAdapter,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  },
  handler: (req, res) => {
    console.log(`Rate limit exceeded for user: ${req.user?.id || 'unknown'} at ${new Date().toISOString()}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this user, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes in seconds
    });
  }
});

// Special rate limiter for admin routes (higher limits)
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit for admin users
  message: 'Too many admin requests, please try again later.',
  keyGenerator: (req) => {
    return req.user ? `admin_${req.user.id}` : req.ip;
  },
  store: userRateLimitStoreAdapter,
  skip: (req) => {
    // Skip rate limiting for admin users (they should have higher limits)
    return req.user && req.user.role === 'admin';
  },
  handler: (req, res) => {
    console.log(`Admin rate limit exceeded for user: ${req.user?.id || 'unknown'} at ${new Date().toISOString()}`);
    res.status(429).json({
      success: false,
      message: 'Too many admin requests, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes in seconds
    });
  }
});

// Clean up old entries periodically (every 15 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of userRateLimitStore.entries()) {
    if (now >= record.resetTime) {
      userRateLimitStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

module.exports = {
  userRateLimiter,
  adminRateLimiter
}; 