/**
 * Payment Controller
 * Handles Xendit QR code generation and payment verification
 */

import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { paymentService } from '../services/payment.service';
import { successResponse, errorResponse } from '../utils/helpers';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import pool from '../config/database';
import logger from '../utils/logger';

/**
 * Create QR code for order payment
 * POST /api/payment/create-qr
 */
export const createPaymentQR = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { order_id, amount } = req.body;

  if (!order_id || !amount) {
    throw new AppError('Order ID and amount are required', 400);
  }

  // Verify order exists
  const conn = await pool.getConnection();
  try {
    const [orderRows] = await conn.query(
      `SELECT order_id, order_number, final_amount, payment_status
       FROM customer_order
       WHERE order_id = ? AND is_deleted = FALSE`,
      [order_id]
    );

    const orders = Array.isArray(orderRows) ? orderRows : [orderRows];
    if (orders.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const order: any = orders[0];

    if (order.payment_status === 'paid') {
      throw new AppError('Order has already been paid', 400);
    }

    // Verify amount matches
    if (Math.abs(order.final_amount - amount) > 0.01) {
      throw new AppError('Amount mismatch', 400);
    }

    // Create Xendit QR code
    const qrCodeResult = await paymentService.createQRCode({
      externalId: order.order_number,
      amount: amount,
      callbackUrl: process.env.API_URL || 'http://localhost:5000',
    });

    if (!qrCodeResult.success) {
      throw new AppError(qrCodeResult.error || 'Failed to create QR code', 500);
    }

    // Store QR code ID in order
    await conn.query(
      `UPDATE customer_order
       SET payment_reference_number = ?
       WHERE order_id = ?`,
      [qrCodeResult.qrId, order_id]
    );

    logger.info(`✓ QR code created for order ${order.order_number}: ${qrCodeResult.qrId}`);

    res.json(successResponse('QR code created successfully', {
      qr_id: qrCodeResult.qrId,
      qr_string: qrCodeResult.qrString,
      order_number: order.order_number,
      amount: qrCodeResult.amount,
    }));
  } finally {
    conn.release();
  }
});

/**
 * Check payment status for an order
 * GET /api/payment/status/:orderId
 */
export const checkPaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;

  const conn = await pool.getConnection();
  try {
    const [orderRows] = await conn.query(
      `SELECT order_id, order_number, payment_status, payment_reference_number, final_amount
       FROM customer_order
       WHERE order_id = ? AND is_deleted = FALSE`,
      [orderId]
    );

    const orders = Array.isArray(orderRows) ? orderRows : [orderRows];
    if (orders.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const order: any = orders[0];

    // If already paid, return success
    if (order.payment_status === 'paid') {
      return res.json(successResponse('Payment already completed', {
        paid: true,
        order_id: order.order_id,
        order_number: order.order_number,
        payment_status: 'paid',
      }));
    }

    // Check with Xendit if we have a QR code ID
    if (order.payment_reference_number) {
      const paymentStatus = await paymentService.getQRCodeStatus(order.payment_reference_number);

      if (paymentStatus.success && paymentStatus.status === 'completed') {
        // Update order payment status
        await conn.query(
          `UPDATE customer_order
           SET payment_status = 'paid',
               payment_verified_at = NOW()
           WHERE order_id = ?`,
          [order.order_id]
        );

        logger.info(`✓ Payment verified for order ${order.order_number}`);

        return res.json(successResponse('Payment completed', {
          paid: true,
          order_id: order.order_id,
          order_number: order.order_number,
          payment_status: 'paid',
        }));
      }
    }

    // Still pending
    res.json(successResponse('Payment pending', {
      paid: false,
      order_id: order.order_id,
      order_number: order.order_number,
      payment_status: order.payment_status,
    }));
  } finally {
    conn.release();
  }
});

/**
 * Xendit webhook for QR code payment completion
 * POST /api/webhooks/xendit/qr-payment
 */
export const handleXenditWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const webhookData = req.body;

  logger.info('📥 Received Xendit webhook:', JSON.stringify(webhookData));

  // Validate webhook (you should verify the callback token in production)
  const { id, external_id, status, amount } = webhookData;

  if (status === 'COMPLETED') {
    const conn = await pool.getConnection();
    try {
      // Find order by external_id (order_number) or QR code ID
      const [orderRows] = await conn.query(
        `SELECT order_id, order_number, final_amount, payment_status
         FROM customer_order
         WHERE (order_number = ? OR payment_reference_number = ?)
         AND is_deleted = FALSE`,
        [external_id, id]
      );

      const orders = Array.isArray(orderRows) ? orderRows : [orderRows];
      if (orders.length > 0) {
        const order: any = orders[0];

        // Update payment status
        await conn.query(
          `UPDATE customer_order
           SET payment_status = 'paid',
               payment_verified_at = NOW(),
               payment_reference_number = ?
           WHERE order_id = ?`,
          [id, order.order_id]
        );

        logger.info(`✅ Payment completed via webhook for order ${order.order_number} - Amount: ₱${amount}`);
      }
    } finally {
      conn.release();
    }
  }

  // Always return 200 to acknowledge webhook
  res.status(200).json({ received: true });
});
