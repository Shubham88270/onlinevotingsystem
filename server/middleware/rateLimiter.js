// Production-grade in-memory rate limiter with TTL cleanup
const attempts = new Map();

// Cleanup expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of attempts.entries()) {
    if (now > data.resetAt) attempts.delete(key);
  }
}, 5 * 60 * 1000);

const rateLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // Use user ID if authenticated, otherwise IP
    const userId = req.user?._id?.toString();
    const key    = (userId || req.ip) + req.path;
    const now    = Date.now();
    const data   = attempts.get(key) || { count: 0, resetAt: now + windowMs };

    // Reset window if expired
    if (now > data.resetAt) {
      data.count   = 0;
      data.resetAt = now + windowMs;
    }

    data.count++;
    attempts.set(key, data);

    if (data.count > maxAttempts) {
      const retryAfter = Math.ceil((data.resetAt - now) / 1000);
      return res.status(429).json({
        message: `Too many attempts. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    next();
  };
};

module.exports = rateLimiter;
