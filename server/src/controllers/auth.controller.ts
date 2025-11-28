import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow } from '../utils/typeGuards';
import { JwtPayload } from '../models/types';
import { diagnoseJWTConfig } from '../utils/jwtDiagnostic';
import logger from '../utils/logger';

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
      logger.error('⚠️  CRITICAL: Admin login attempted but server is using default JWT secret!');
      logger.error('    Create a .env file with secure JWT secrets to fix this issue.');
    }

    // Find admin user
    const admin = getFirstRow<any>(await query(
      `SELECT a.admin_id, a.username, a.email, a.name, a.password_hash, r.role_name
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
    logger.info(`✓ Admin login successful: ${admin.username} (Secret hash: ${jwtDiag.adminJwtSecretHash})`);

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
    logger.error('Admin login error:', error);
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
      logger.error('⚠️  CRITICAL: Cashier login attempted but server is using default JWT secret!');
      logger.error('    Create a .env file with secure JWT secrets to fix this issue.');
    }

    // Find cashier
    const cashier = getFirstRow<any>(await query(
      'SELECT cashier_id, cashier_code, name, pin_hash FROM cashier WHERE cashier_code = ? AND is_active = TRUE',
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
    logger.info(`✓ Cashier login successful: ${cashier.cashier_code} (Secret hash: ${jwtDiag.cashierJwtSecretHash})`);

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
    logger.error('Cashier login error:', error);
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

// Update admin username
export const updateAdminUsername = async (req: any, res: Response) => {
  try {
    const { new_username, password } = req.body;
    const admin_id = req.user?.id;

    if (!new_username || !password) {
      throw new AppError('New username and current password are required', 400);
    }

    if (typeof new_username !== 'string' || new_username.trim().length < 3) {
      throw new AppError('Username must be at least 3 characters long', 400);
    }

    // Get current admin
    const admin = getFirstRow<any>(await query(
      'SELECT admin_id, password_hash FROM admin WHERE admin_id = ?',
      [admin_id]
    ));

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid password', 401);
    }

    // Check if new username already exists
    const existingAdmin = getFirstRow<any>(await query(
      'SELECT admin_id FROM admin WHERE username = ? AND admin_id != ?',
      [new_username.trim(), admin_id]
    ));

    if (existingAdmin) {
      throw new AppError('Username already exists', 400);
    }

    // Update username
    await query(
      'UPDATE admin SET username = ? WHERE admin_id = ?',
      [new_username.trim(), admin_id]
    );

    res.json(successResponse('Username updated successfully'));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Update username error:', error);
    throw new AppError('Failed to update username', 500);
  }
};

// Update admin password
export const updateAdminPassword = async (req: any, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    const admin_id = req.user?.id;

    if (!current_password || !new_password) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (typeof new_password !== 'string' || new_password.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    // Get current admin
    const admin = getFirstRow<any>(await query(
      'SELECT admin_id, password_hash FROM admin WHERE admin_id = ?',
      [admin_id]
    ));

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, admin.password_hash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    // Update password
    await query(
      'UPDATE admin SET password_hash = ? WHERE admin_id = ?',
      [password_hash, admin_id]
    );

    res.json(successResponse('Password updated successfully'));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Update password error:', error);
    throw new AppError('Failed to update password', 500);
  }
};
