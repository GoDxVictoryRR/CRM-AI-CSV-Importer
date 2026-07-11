import rateLimit from 'express-rate-limit';

/**
 * Limit requests to import endpoint to prevent API key exhaustions.
 * Allows maximum of 10 requests per 10 minutes per IP.
 */
export const importRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: 'Too many import requests from this IP. Please try again after 10 minutes.'
  }
});
