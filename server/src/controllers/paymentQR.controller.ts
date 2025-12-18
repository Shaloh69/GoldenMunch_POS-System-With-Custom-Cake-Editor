import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';
import { uploadPaymentQR as uploadPaymentQRToSupabase, deleteFromSupabase, extractFilePathFromUrl } from '../utils/supabaseUpload';
import { STORAGE_BUCKETS } from '../config/supabase';

// Upload Payment QR Code (Admin only)
export const uploadPaymentQR = async (req: AuthRequest, res: Response) => {
  const { payment_method } = req.body;

  if (!payment_method || !['gcash', 'paymaya'].includes(payment_method)) {
    throw new AppError('Invalid payment method. Must be gcash or paymaya', 400);
  }

  if (!req.file) {
    throw new AppError('QR code image is required', 400);
  }

  // Upload to Supabase
  const uploadResult = await uploadPaymentQRToSupabase(req.file, payment_method);
  if (!uploadResult.success) {
    throw new AppError(uploadResult.error || 'Failed to upload QR code', 400);
  }

  const qrCodeUrl = uploadResult.url!;
  const settingKey = `${payment_method}_qr_code_url`;

  // Check if setting exists
  const existingSetting = getFirstRow<any>(
    await query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [settingKey]
    )
  );

  if (existingSetting) {
    // Delete old QR code from Supabase if it exists
    if (existingSetting.setting_value) {
      const oldFilePath = extractFilePathFromUrl(existingSetting.setting_value, STORAGE_BUCKETS.PAYMENT_QR);
      if (oldFilePath) {
        await deleteFromSupabase(STORAGE_BUCKETS.PAYMENT_QR, oldFilePath);
      }
    }

    // Update existing setting
    await query(
      'UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      [qrCodeUrl, req.user?.id, settingKey]
    );
  } else {
    // Create new setting
    await query(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
       VALUES (?, ?, 'string', ?, TRUE, ?)`,
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
      'SELECT setting_value FROM system_settings WHERE setting_key = ? AND is_public = TRUE',
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
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['gcash_qr_code_url']
    )
  );

  const paymayaSetting = getFirstRow<any>(
    await query(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
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

// Delete Payment QR Code (Admin only)
export const deletePaymentQR = async (req: AuthRequest, res: Response) => {
  const { paymentMethod } = req.params;

  if (!paymentMethod || !['gcash', 'paymaya'].includes(paymentMethod)) {
    throw new AppError('Invalid payment method. Must be gcash or paymaya', 400);
  }

  const settingKey = `${paymentMethod}_qr_code_url`;

  // Get existing setting to delete the file
  const existingSetting = getFirstRow<any>(
    await query(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      [settingKey]
    )
  );

  if (!existingSetting || !existingSetting.setting_value) {
    throw new AppError(`${paymentMethod.toUpperCase()} QR code not found`, 404);
  }

  // Delete the file from Supabase
  const filePath = extractFilePathFromUrl(existingSetting.setting_value, STORAGE_BUCKETS.PAYMENT_QR);
  if (filePath) {
    const deleteResult = await deleteFromSupabase(STORAGE_BUCKETS.PAYMENT_QR, filePath);
    if (!deleteResult.success) {
      console.error('Failed to delete QR code from Supabase:', deleteResult.error);
      // Continue anyway to remove from database
    }
  }

  // Delete the database record
  await query(
    'DELETE FROM system_settings WHERE setting_key = ?',
    [settingKey]
  );

  res.json(
    successResponse(`${paymentMethod.toUpperCase()} QR code deleted successfully`, {
      payment_method: paymentMethod
    })
  );
};
