import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow } from '../utils/typeGuards';
import { JwtPayload } from '../models/types';
import { diagnoseJWTConfig } from '../utils/jwtDiagnostic';

// Admin login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new AppError('Username is required', 400);
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      throw new AppError('Password is required', 400);
    }

    // Check JWT configuration
    const jwtDiag = diagnoseJWTConfig();
    if (jwtDiag.usingDefaultSecret) {
      console.error('⚠️  CRITICAL: Admin login attempted but server is using default JWT secret!');
      console.error('    Create a .env file with secure JWT secrets to fix this issue.');
    }

    // Find admin user
    const admin = getFirstRow<any>(await query(
      `SELECT a.*, r.role_name
       FROM admin a
       JOIN roles r ON a.role_id = r.role_id
       WHERE a.username = ? AND a.is_active = TRUE`,
      [username.trim()]
    ));

    if (!admin) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await query('UPDATE admin SET last_login = NOW() WHERE admin_id = ?', [
      admin.admin_id,
    ]);

    // Generate JWT with the EXACT same secret that will be used for verification
    const payload: JwtPayload = {
      id: admin.admin_id,
      username: admin.username,
      email: admin.email,
      role: admin.role_name,
      type: 'admin',
    };

    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
    } as jwt.SignOptions);

    // Log successful login with secret hash for debugging
    console.log(`✓ Admin login successful: ${admin.username} (Secret hash: ${jwtDiag.adminJwtSecretHash})`);

    res.json(
      successResponse('Login successful', {
        token,
        user: {
          id: admin.admin_id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role_name,
          type: 'admin',
        },
      })
    );
  } catch (error) {
    // Re-throw AppError instances
    if (error instanceof AppError) {
      throw error;
    }

    // Log unexpected errors
    console.error('Admin login error:', error);
    throw new AppError('Login failed', 500);
  }
};

// Cashier login
export const cashierLogin = async (req: Request, res: Response) => {
  try {
    const { cashier_code, pin } = req.body;

    // Input validation
    if (!cashier_code || typeof cashier_code !== 'string' || cashier_code.trim() === '') {
      throw new AppError('Cashier code is required', 400);
    }

    if (!pin || typeof pin !== 'string' || pin.trim() === '') {
      throw new AppError('PIN is required', 400);
    }

    // Check JWT configuration
    const jwtDiag = diagnoseJWTConfig();
    if (jwtDiag.usingDefaultSecret) {
      console.error('⚠️  CRITICAL: Cashier login attempted but server is using default JWT secret!');
      console.error('    Create a .env file with secure JWT secrets to fix this issue.');
    }

    // Find cashier
    const cashier = getFirstRow<any>(await query(
      'SELECT * FROM cashier WHERE cashier_code = ? AND is_active = TRUE',
      [cashier_code.trim()]
    ));

    if (!cashier) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, cashier.pin_hash);

    if (!isValidPin) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT with the EXACT same secret that will be used for verification
    const payload: JwtPayload = {
      id: cashier.cashier_id,
      username: cashier.cashier_code,
      type: 'cashier',
    };

    const secret = process.env.CASHIER_JWT_SECRET || process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.CASHIER_JWT_EXPIRES_IN || '12h',
    } as jwt.SignOptions);

    // Log successful login with secret hash for debugging
    console.log(`✓ Cashier login successful: ${cashier.cashier_code} (Secret hash: ${jwtDiag.cashierJwtSecretHash})`);

    res.json(
      successResponse('Login successful', {
        token,
        cashier: {
          id: cashier.cashier_id,
          name: cashier.name,
          cashier_code: cashier.cashier_code,
        },
        user: {
          id: cashier.cashier_id,
          username: cashier.cashier_code,
          name: cashier.name,
          type: 'cashier',
        },
      })
    );
  } catch (error) {
    // Re-throw AppError instances
    if (error instanceof AppError) {
      throw error;
    }

    // Log unexpected errors
    console.error('Cashier login error:', error);
    throw new AppError('Login failed', 500);
  }
};

// Verify token
export const verifyToken = async (_req: Request, res: Response) => {
  // If we reach here, token is valid (middleware verified it)
  res.json(successResponse('Token is valid'));
};

// Diagnostic endpoint to check JWT configuration
export const diagnosticJWT = async (_req: Request, res: Response) => {
  const diagnostic = diagnoseJWTConfig();

  res.json({
    success: true,
    message: 'JWT Configuration Diagnostic',
    data: {
      hasJwtSecret: diagnostic.hasJwtSecret,
      hasAdminJwtSecret: diagnostic.hasAdminJwtSecret,
      hasCashierJwtSecret: diagnostic.hasCashierJwtSecret,
      jwtSecretHash: diagnostic.jwtSecretHash,
      adminJwtSecretHash: diagnostic.adminJwtSecretHash,
      cashierJwtSecretHash: diagnostic.cashierJwtSecretHash,
      usingDefaultSecret: diagnostic.usingDefaultSecret,
      allSecretsMatch: diagnostic.allSecretsMatch,
      recommendation: diagnostic.recommendation,
    },
  });
};
