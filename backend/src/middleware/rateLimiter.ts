import rateLimit from 'express-rate-limit';

/**
 * Per-IP rate limiter for the import endpoint.
 *
 * The frontend batches a single CSV upload into multiple sequential API calls
 * (30 rows/batch). A 3000-row file = 100 batches from one IP. Limit is set to
 * 100 req / 10 min to accommodate large single-file imports without false-blocking.
 *
 * Real Gemini quota protection is handled by quotaGuard.ts (global daily cap
 * across all IPs) — this limiter only prevents a single client from monopolising
 * the endpoint endpoint or brute-forcing it.
 */
export const importRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Allows up to ~3000-row CSV per 10-min window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many import requests from this IP. Please wait 10 minutes before retrying.'
  }
});
