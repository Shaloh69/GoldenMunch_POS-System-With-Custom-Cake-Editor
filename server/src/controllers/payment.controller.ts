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
 * Create payment invoice with QR code for order payment
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

    // Create Xendit Invoice with QR code
    const invoiceResult = await paymentService.createInvoice({
      externalId: order.order_number,
      amount: amount,
      description: `GoldenMunch Order #${order.order_number}`,
      payerEmail: 'customer@goldenmunch.com',
    });

    if (!invoiceResult.success) {
      throw new AppError(invoiceResult.error || 'Failed to create payment invoice', 500);
    }

    // Validate that we got invoice data
    if (!invoiceResult.invoiceUrl || !invoiceResult.qrCodeDataUrl) {
      logger.error(`❌ Invoice created but missing data!`);
      logger.error(`Invoice ID: ${invoiceResult.invoiceId}`);
      logger.error(`Raw response:`, JSON.stringify(invoiceResult.rawResponse, null, 2));
      throw new AppError(
        'Payment invoice created but missing required data. ' +
        'Please verify that QRPH is enabled on your Xendit account.',
        500
      );
    }

    // Store invoice ID in order
    await conn.query(
      `UPDATE customer_order
       SET payment_reference_number = ?
       WHERE order_id = ?`,
      [invoiceResult.invoiceId, order_id]
    );

    logger.info(`✓ Invoice created for order ${order.order_number}: ${invoiceResult.invoiceId}`);

    res.json(successResponse('Payment QR code created successfully', {
      invoice_id: invoiceResult.invoiceId,
      invoice_url: invoiceResult.invoiceUrl,
      qr_code_image: invoiceResult.qrCodeDataUrl,
      order_number: order.order_number,
      amount: invoiceResult.amount,
      expiry_date: invoiceResult.expiryDate,
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

    // Check with Xendit if we have an invoice ID
    if (order.payment_reference_number) {
      const paymentStatus = await paymentService.getInvoiceStatus(order.payment_reference_number);

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
 * Xendit webhook for invoice payment completion
 * POST /api/webhooks/xendit/qr-payment
 * Also handles /api/webhooks/xendit/invoice
 */
export const handleXenditWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const webhookData = req.body;

  logger.info('📥 Received Xendit webhook:', JSON.stringify(webhookData));

  // Validate webhook (you should verify the callback token in production)
  const { id, external_id, status, amount } = webhookData;

  // Invoice API uses 'PAID' status
  if (status === 'PAID' || status === 'SETTLED' || status === 'COMPLETED') {
    const conn = await pool.getConnection();
    try {
      // Find order by external_id (order_number) or invoice ID
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

/**
 * Payment success redirect page
 * GET /api/payment/success
 */
export const paymentSuccessPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { external_id } = req.query;

  logger.info(`✅ Payment success redirect for order: ${external_id}`);

  // Send HTML success page
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - GoldenMunch</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .success-icon {
          width: 80px;
          height: 80px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px;
          animation: scaleIn 0.5s ease-out;
        }
        .success-icon svg {
          width: 50px;
          height: 50px;
          stroke: white;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
        h1 {
          color: #1f2937;
          font-size: 32px;
          margin-bottom: 15px;
        }
        p {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .order-number {
          background: #f3f4f6;
          padding: 15px 25px;
          border-radius: 10px;
          font-size: 14px;
          color: #374151;
          margin-bottom: 30px;
        }
        .order-number strong {
          color: #667eea;
          font-size: 18px;
        }
        .close-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .close-btn:hover {
          transform: translateY(-2px);
        }
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1>Payment Successful!</h1>
        <p>Your payment has been processed successfully. Your order is being prepared.</p>
        ${external_id ? `
          <div class="order-number">
            Order Number: <strong>${external_id}</strong>
          </div>
        ` : ''}
        <p style="font-size: 14px; color: #9ca3af;">You can close this window now and return to the kiosk.</p>
        <button class="close-btn" onclick="window.close()">Close Window</button>
      </div>
    </body>
    </html>
  `);
});

/**
 * Payment failed redirect page
 * GET /api/payment/failed
 */
export const paymentFailedPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { external_id } = req.query;

  logger.info(`❌ Payment failed redirect for order: ${external_id}`);

  // Send HTML failure page
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed - GoldenMunch</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .error-icon {
          width: 80px;
          height: 80px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px;
          animation: scaleIn 0.5s ease-out;
        }
        .error-icon svg {
          width: 50px;
          height: 50px;
          stroke: white;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
        h1 {
          color: #1f2937;
          font-size: 32px;
          margin-bottom: 15px;
        }
        p {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .order-number {
          background: #f3f4f6;
          padding: 15px 25px;
          border-radius: 10px;
          font-size: 14px;
          color: #374151;
          margin-bottom: 30px;
        }
        .order-number strong {
          color: #ef4444;
          font-size: 18px;
        }
        .close-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .close-btn:hover {
          transform: translateY(-2px);
        }
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <h1>Payment Failed</h1>
        <p>We couldn't process your payment. Please try again or contact staff for assistance.</p>
        ${external_id ? `
          <div class="order-number">
            Order Number: <strong>${external_id}</strong>
          </div>
        ` : ''}
        <p style="font-size: 14px; color: #9ca3af;">You can close this window and try again at the kiosk.</p>
        <button class="close-btn" onclick="window.close()">Close Window</button>
      </div>
    </body>
    </html>
  `);
});
