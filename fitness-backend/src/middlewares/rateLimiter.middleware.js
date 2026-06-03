import rateLimit from 'express-rate-limit';

const limiterMessage = (code) => ({
  success: false,
  error: { code, message: 'Too many requests, please try again later.', statusCode: 429 },
});

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: limiterMessage('RATE_LIMIT_EXCEEDED'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limiterMessage('AUTH_RATE_LIMIT_EXCEEDED'),
});
