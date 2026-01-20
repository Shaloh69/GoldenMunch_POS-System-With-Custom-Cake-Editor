import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../models/types';
import { AppError } from './error.middleware';

// Helper function to extract token from request
const getTokenFromRequest = (req: AuthRequest): string | undefined => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix and trim whitespace
  } else if (req.query.token && typeof req.query.token === 'string') {
    // For SSE connections which cannot set custom headers
    token = req.query.token.trim();
  }
  return token;
};

// Verify JWT token
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT Verification Error:', {
        error: error.message,
        url: req.url,
        method: req.method,
      });
      next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Admin authentication
export const authenticateAdmin = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    if (decoded.type !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      console.error('Admin JWT Verification Error:', {
        error: error.message,
        url: req.url,
        method: req.method,
      });
      next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Cashier authentication
export const authenticateCashier = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.CASHIER_JWT_SECRET || process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;

    if (decoded.type !== 'cashier' && decoded.type !== 'admin') {
      throw new AppError('Cashier or Admin access required', 403);
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      console.error('Cashier JWT Verification Error:', {
        error: error.message,
        url: req.url,
        method: req.method,
        authHeader: req.headers.authorization ? 'Present' : 'Missing',
      });
      next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Optional authentication (for kiosk - anonymous allowed)
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as JwtPayload;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication for kiosk
    next();
  }
};
