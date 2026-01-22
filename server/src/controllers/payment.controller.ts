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
import { PoolConnection } from 'mysql2/promise';

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
 * Reusable helper function to process a paid order within a transaction.
 * This function handles stock deduction, order status updates, and logging.
 * @param conn - The database connection.
 * @param order - The order object to be processed.
 * @param paymentReference - The payment gateway's reference number (e.g., invoice ID).
 * @param source - The source of the payment confirmation ('webhook' or 'polling').
 */
async function processPaidOrder(conn: PoolConnection, order: any, paymentReference: string, source: 'webhook' | 'polling') {
  logger.info(`[${source}] Payment for order ${order.order_number} is PAID. Processing...`);

  await conn.beginTransaction();
  try {
    // 1. STOCK DEDUCTION
    const [orderItemsRows] = await conn.query(
      'SELECT menu_item_id, quantity FROM order_item WHERE order_id = ?',
      [order.order_id]
    );
    const orderItems = orderItemsRows as any[];
    for (const item of orderItems) {
      const [menuItemRows] = await conn.query(
        'SELECT is_infinite_stock, stock_quantity, name FROM menu_item WHERE menu_item_id = ?',
        [item.menu_item_id]
      );
      const menuItem = (menuItemRows as any[])[0];
      if (menuItem && !menuItem.is_infinite_stock) {
        await conn.query(
          'UPDATE menu_item SET stock_quantity = stock_quantity - ? WHERE menu_item_id = ?',
          [item.quantity, item.menu_item_id]
        );
      }
    }
    logger.info(`   ✓ Stock deducted for order ${order.order_number}`);

    // 2. UPDATE ORDER STATUS
    await conn.query(
      `UPDATE customer_order
       SET payment_status = 'paid',
           order_status = 'confirmed',
           payment_verified_at = NOW(),
           amount_paid = ?,
           change_amount = 0
       WHERE order_id = ?`,
      [order.final_amount, order.order_id]
    );
    logger.info(`   ✓ Order status updated to 'confirmed' for order ${order.order_number}`);

    // 3. RECORD TRANSACTION
    await conn.query(
      `INSERT INTO payment_transaction
       (order_id, transaction_type, payment_method, amount, reference_number, status, processed_by, completed_at)
       VALUES (?, 'payment', 'cashless', ?, ?, 'completed', NULL, NOW())`,
      [order.order_id, order.final_amount, paymentReference]
    );
    logger.info(`   ✓ Payment transaction recorded for order ${order.order_number}`);

    // 4. ADD TIMELINE ENTRY
    await conn.query(
      `INSERT INTO order_timeline (order_id, status, notes) VALUES (?, 'confirmed', ?)`,
      [order.order_id, `Auto-confirmed via ${source} (Ref: ${paymentReference})`]
    );
    logger.info(`   ✓ Timeline entry added for order ${order.order_number}`);

    await conn.commit();
    logger.info(`✅ Order ${order.order_number} auto-completed successfully via ${source}.`);
  } catch (error) {
    await conn.rollback();
    logger.error(`❌ Error processing paid order ${order.order_number} via ${source}:`, error);
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}

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

    // If order is already confirmed or beyond, it's fully processed.
    // This is safer than just checking `payment_status` as it handles partially-updated orders.
    if (order.order_status !== 'pending') {
      return res.json(successResponse('Payment already completed', {
        paid: true,
        order_id: order.order_id,
        order_number: order.order_number,
        // The payment_status is guaranteed to be 'paid' if the order_status is not 'pending'
        // for a successfully processed order.
        payment_status: 'paid', 
      }));
    }

    // Check with Xendit if we have an invoice ID
    if (order.payment_reference_number) {
      const paymentStatus = await paymentService.getInvoiceStatus(order.payment_reference_number);

      if (paymentStatus.success && paymentStatus.status === 'completed') {
        try {
          // Use the refactored helper function to process the paid order
          await processPaidOrder(conn, order, order.payment_reference_number, 'polling');

          return res.json(successResponse('Payment completed', {
            paid: true,
            order_id: order.order_id,
            payment_status: 'paid',
          }));
        } catch (error) {
          // Do not throw error to client, allow polling to retry.
        }
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
        `SELECT *
         FROM customer_order
         WHERE (order_number = ? OR payment_reference_number = ?)
         AND is_deleted = FALSE`,
        [external_id, id]
      );

      const order: any = (orderRows as any[])[0];

      // Process if the order exists, is cashless, and is still in 'pending' state.
      // This is safer than checking payment_status, as it handles cases where
      // a previous partial update may have occurred.
      if (order && order.order_status === 'pending' && order.payment_method === 'cashless') {
        // Use the refactored helper function to process the paid order
        await processPaidOrder(conn, order, id, 'webhook');
      } else {
        logger.warn(`⚠️  Webhook for order ${external_id} skipped. Reason: Order not found, already paid, or not a cashless payment.`);
      }
    } catch (error) {
      logger.error('❌ Error processing Xendit webhook:', error);
      // Still return 200 to prevent Xendit from retrying
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
