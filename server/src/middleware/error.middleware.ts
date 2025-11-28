import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import logger from '../utils/logger';
import { errorResponse } from '../utils/helpers';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error handler
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size is too large. Maximum size is 10MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded. Maximum is 5 files.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field in upload.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart upload.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name is too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value is too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in upload.';
        break;
      default:
        message = `File upload error: ${err.message}`;
    }
  } else if (err.message && err.message.includes('Only image files are allowed')) {
    // Handle custom file filter errors
    statusCode = 400;
    message = err.message;
  }

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    statusCode,
    errorType: err.constructor.name,
  });

  // Send error response
  res.status(statusCode).json(
    errorResponse(
      message,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = <T = any>(fn: (req: any, res: Response, next: NextFunction) => Promise<T>) => {
  return (req: any, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
