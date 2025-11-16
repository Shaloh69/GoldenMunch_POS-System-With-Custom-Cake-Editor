import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { JwtPayload } from '../models/types';

// Admin login
export const adminLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const [admin] = await query(
    `SELECT a.*, r.role_name
     FROM admin a
     JOIN roles r ON a.role_id = r.role_id
     WHERE a.username = ? AND a.is_active = TRUE`,
    [username]
  );

  if (!admin) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(password, admin.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  await query('UPDATE admin SET last_login = NOW() WHERE admin_id = ?', [
    admin.admin_id,
  ]);

  // Generate JWT
  const payload: JwtPayload = {
    id: admin.admin_id,
    username: admin.username,
    email: admin.email,
    role: admin.role_name,
    type: 'admin',
  };

  const token = jwt.sign(
    payload,
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'secret',
    {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
    }
  );

  res.json(
    successResponse('Login successful', {
      token,
      user: {
        id: admin.admin_id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role_name,
      },
    })
  );
};

// Cashier login
export const cashierLogin = async (req: Request, res: Response) => {
  const { cashier_code, pin } = req.body;

  const [cashier] = await query(
    'SELECT * FROM cashier WHERE cashier_code = ? AND is_active = TRUE',
    [cashier_code]
  );

  if (!cashier) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPin = await bcrypt.compare(pin, cashier.pin_hash);

  if (!isValidPin) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate JWT
  const payload: JwtPayload = {
    id: cashier.cashier_id,
    username: cashier.cashier_code,
    type: 'cashier',
  };

  const token = jwt.sign(
    payload,
    process.env.CASHIER_JWT_SECRET || process.env.JWT_SECRET || 'secret',
    {
      expiresIn: process.env.CASHIER_JWT_EXPIRES_IN || '12h',
    }
  );

  res.json(
    successResponse('Login successful', {
      token,
      cashier: {
        id: cashier.cashier_id,
        name: cashier.name,
        cashier_code: cashier.cashier_code,
      },
    })
  );
};

// Verify token
export const verifyToken = async (req: Request, res: Response) => {
  // If we reach here, token is valid (middleware verified it)
  res.json(successResponse('Token is valid'));
};
