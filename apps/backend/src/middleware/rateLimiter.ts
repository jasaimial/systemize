import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

// TODO: When scaling horizontally (multiple App Service instances / K8s pods),
// switch to rate-limit-redis for shared rate limit state across instances.
// See RFC 003: apps/backend/docs/rfc/003-distributed-rate-limiting.md
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
