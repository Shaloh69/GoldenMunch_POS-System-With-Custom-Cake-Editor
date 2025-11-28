import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Custom Cake Session Storage
 * In production, use Redis or database for persistent storage
 */
interface CustomCakeSession {
  sessionId: string;
  kioskSessionId: string;
  menuItemId?: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  customizationData?: {
    flavor_id?: number;
    size_id?: number;
    theme_id?: number;
    frosting_color?: string;
    frosting_type?: string;
    decoration_details?: string;
    cake_text?: string;
    special_instructions?: string;
    design_complexity?: string;
  };
}

// In-memory storage (use Redis in production)
const customCakeSessions = new Map<string, CustomCakeSession>();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of customCakeSessions.entries()) {
    if (session.expiresAt < now) {
      customCakeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Create a new custom cake session and generate QR code
 */
export const createCustomCakeSession = async (req: AuthRequest, res: Response) => {
  const { kiosk_session_id, menu_item_id } = req.body;

  if (!kiosk_session_id) {
    throw new AppError('Kiosk session ID is required', 400);
  }

  // Generate unique session ID
  const sessionId = crypto.randomBytes(16).toString('hex');

  // Session expires in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Create session
  const session: CustomCakeSession = {
    sessionId,
    kioskSessionId: kiosk_session_id,
    menuItemId: menu_item_id,
    createdAt: new Date(),
    expiresAt,
    status: 'pending',
  };

  customCakeSessions.set(sessionId, session);

  // Generate URL for mobile customization
  const baseUrl = process.env.FRONTEND_URL;

  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('FRONTEND_URL environment variable is required in production', 500);
    }
    // Development fallback
    logger.warn('⚠️  FRONTEND_URL not set, using localhost fallback');
  }

  const customizationUrl = `${baseUrl || 'http://localhost:3002'}/customize/${sessionId}`;

  // Generate QR code as data URL
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(customizationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#8B4513', // chocolate-brown
        light: '#FFFFFF',
      },
    });

    res.json(successResponse('Custom cake session created', {
      sessionId,
      customizationUrl,
      qrCodeDataUrl,
      expiresAt,
    }));
  } catch (error) {
    throw new AppError('Failed to generate QR code', 500);
  }
};

/**
 * Get session details
 */
export const getCustomCakeSession = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;

  const session = customCakeSessions.get(sessionId);

  if (!session) {
    throw new AppError('Session not found or expired', 404);
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    session.status = 'expired';
    customCakeSessions.delete(sessionId);
    throw new AppError('Session has expired', 410);
  }

  res.json(successResponse('Session retrieved', session));
};

/**
 * Update session with customization data
 */
export const updateCustomCakeSession = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const customizationData = req.body;

  const session = customCakeSessions.get(sessionId);

  if (!session) {
    throw new AppError('Session not found or expired', 404);
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    session.status = 'expired';
    customCakeSessions.delete(sessionId);
    throw new AppError('Session has expired', 410);
  }

  // Update session
  session.customizationData = customizationData;
  session.status = 'in_progress';
  customCakeSessions.set(sessionId, session);

  res.json(successResponse('Session updated', session));
};

/**
 * Complete customization and mark session as ready
 */
export const completeCustomCakeSession = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;

  const session = customCakeSessions.get(sessionId);

  if (!session) {
    throw new AppError('Session not found or expired', 404);
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    session.status = 'expired';
    customCakeSessions.delete(sessionId);
    throw new AppError('Session has expired', 410);
  }

  if (!session.customizationData) {
    throw new AppError('No customization data found', 400);
  }

  // Mark as completed
  session.status = 'completed';
  customCakeSessions.set(sessionId, session);

  res.json(successResponse('Customization completed', session));
};

/**
 * Poll session status (for kiosk to check if customization is complete)
 */
export const pollCustomCakeSession = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;

  const session = customCakeSessions.get(sessionId);

  if (!session) {
    throw new AppError('Session not found or expired', 404);
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    session.status = 'expired';
    customCakeSessions.delete(sessionId);
    throw new AppError('Session has expired', 410);
  }

  res.json(successResponse('Session status', {
    status: session.status,
    customizationData: session.status === 'completed' ? session.customizationData : undefined,
  }));
};

/**
 * Delete/cancel session
 */
export const deleteCustomCakeSession = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;

  const deleted = customCakeSessions.delete(sessionId);

  if (!deleted) {
    throw new AppError('Session not found', 404);
  }

  res.json(successResponse('Session deleted', null));
};
