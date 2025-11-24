import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';
import path from 'path';
import fs from 'fs';

// Upload Payment QR Code (Admin only)
export const uploadPaymentQR = async (req: AuthRequest, res: Response) => {
  const { payment_method } = req.body;

  if (!payment_method || !['gcash', 'paymaya'].includes(payment_method)) {
    throw new AppError('Invalid payment method. Must be gcash or paymaya', 400);
  }

  if (!req.file) {
    throw new AppError('QR code image is required', 400);
  }

  const file = req.file;
  const qrCodeUrl = `/uploads/payment-qr/${file.filename}`;
  const settingKey = `${payment_method}_qr_code_url`;

  // Check if setting exists
  const existingSetting = getFirstRow<any>(
    await query(
      'SELECT * FROM kiosk_setting WHERE setting_key = ?',
      [settingKey]
    )
  );

  if (existingSetting) {
    // Update existing setting
    await query(
      'UPDATE kiosk_setting SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      [qrCodeUrl, req.user?.id, settingKey]
    );

    // Delete old QR code file if it exists
    if (existingSetting.setting_value && existingSetting.setting_value !== qrCodeUrl) {
      const oldFilePath = path.join(__dirname, '../../', existingSetting.setting_value);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
  } else {
    // Create new setting
    await query(
      `INSERT INTO kiosk_setting (setting_key, setting_value, setting_type, description, updated_by)
       VALUES (?, ?, 'string', ?, ?)`,
      [
        settingKey,
        qrCodeUrl,
        `${payment_method.toUpperCase()} payment QR code URL`,
        req.user?.id
      ]
    );
  }

  res.json(
    successResponse('QR code uploaded successfully', {
      payment_method,
      qr_code_url: qrCodeUrl
    })
  );
};

// Get Payment QR Code (Public - for kiosk)
export const getPaymentQR = async (req: AuthRequest, res: Response) => {
  const { paymentMethod } = req.params;

  if (!paymentMethod || !['gcash', 'paymaya'].includes(paymentMethod)) {
    throw new AppError('Invalid payment method', 400);
  }

  const settingKey = `${paymentMethod}_qr_code_url`;

  const setting = getFirstRow<any>(
    await query(
      'SELECT setting_value FROM kiosk_setting WHERE setting_key = ?',
      [settingKey]
    )
  );

  if (!setting || !setting.setting_value) {
    throw new AppError(`${paymentMethod.toUpperCase()} QR code not configured`, 404);
  }

  res.json(
    successResponse('QR code retrieved', {
      payment_method: paymentMethod,
      qr_code_url: setting.setting_value
    })
  );
};

// Get all payment QR codes (Admin only)
export const getAllPaymentQR = async (req: AuthRequest, res: Response) => {
  const gcashSetting = getFirstRow<any>(
    await query(
      'SELECT setting_value FROM kiosk_setting WHERE setting_key = ?',
      ['gcash_qr_code_url']
    )
  );

  const paymayaSetting = getFirstRow<any>(
    await query(
      'SELECT setting_value FROM kiosk_setting WHERE setting_key = ?',
      ['paymaya_qr_code_url']
    )
  );

  res.json(
    successResponse('Payment QR codes retrieved', {
      gcash: gcashSetting?.setting_value || null,
      paymaya: paymayaSetting?.setting_value || null
    })
  );
};
