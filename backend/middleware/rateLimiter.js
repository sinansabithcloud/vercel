const rateLimit = require('express-rate-limit');

// Create different rate limiters for different endpoints
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Rate limiter for auth endpoints (stricter)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per IP
  'Too many authentication attempts, please try again later'
);

// Rate limiter for general API endpoints
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per IP
  'Too many API requests, please try again later'
);

// Strict rate limiter for password reset
const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 attempts per hour
  'Too many password reset attempts, please try again later'
);

module.exports = {
  authLimiter,
  apiLimiter,
  passwordResetLimiter
};
