import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Global centralized error handling middleware.
 * Ensures detailed errors are logged only server-side to prevent sensitive info leaks.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log full error details server-side
  logger.error(`Unhandled request error at ${req.method} ${req.url}:`, err);

  // Multer errors handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Uploaded file is too large. Limit is 10 MB.'
    });
  }

  // Safe HTTP status code
  const statusCode = err.status || err.statusCode || 500;
  
  // CORS-safe generic error response
  res.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected internal server error occurred.' : err.message
  });
}
