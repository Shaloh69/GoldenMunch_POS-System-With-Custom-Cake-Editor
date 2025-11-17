import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query } from '../config/database';
import { successResponse, validateDateRange } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';

// ==== REFUND MANAGEMENT ====

// Create refund request
export const createRefundRequest = async (req: AuthRequest, res: Response) => {
  const {
    order_id,
    order_item_id,
    refund_type,
    refund_amount,
    refund_reason,
    reason_details,
    refund_method,
  } = req.body;
  const cashier_id = req.user?.id;

  // Verify order exists
  const order = getFirstRow<any>(await query(
    'SELECT * FROM customer_order WHERE order_id = ?',
    [order_id]
  ));

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Create refund request
  const result = await query(
    `INSERT INTO refund_request
     (order_id, order_item_id, refund_type, refund_amount, refund_reason,
      reason_details, refund_method, requested_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order_id,
      order_item_id || null,
      refund_type,
      refund_amount,
      refund_reason,
      reason_details || null,
      refund_method,
      cashier_id,
    ]
  );

  res.status(201).json(
    successResponse('Refund request created', { id: getInsertId(result) })
  );
};

// Get refund requests
export const getRefundRequests = async (req: AuthRequest, res: Response) => {
  const { refund_status, date_from, date_to, page = 1, limit = 20 } = req.query;

  // Validate date range if provided
  if (date_from && date_to) {
    validateDateRange(date_from as string, date_to as string, 365);
  }

  let sql = `
    SELECT rr.*, co.order_number, c.name as requested_by_name
    FROM refund_request rr
    JOIN customer_order co ON rr.order_id = co.order_id
    LEFT JOIN cashier c ON rr.requested_by = c.cashier_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (refund_status) {
    sql += ' AND rr.refund_status = ?';
    params.push(refund_status);
  }

  if (date_from) {
    sql += ' AND DATE(rr.created_at) >= ?';
    params.push(date_from);
  }

  if (date_to) {
    sql += ' AND DATE(rr.created_at) <= ?';
    params.push(date_to);
  }

  // Get total count
  const countSql = sql.replace(/SELECT rr\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = getFirstRow<any>(await query(countSql, params.slice(0, -2)));
  const total = countResult?.total || 0;

  sql += ' ORDER BY rr.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const refunds = await query(sql, params);

  res.json(successResponse('Refund requests retrieved', {
    refunds,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  }));
};

// Get refund details
export const getRefundDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const refund = getFirstRow<any>(await query(
    `SELECT rr.*, co.order_number, co.order_datetime,
            c.name as requested_by_name, a.name as approved_by_name
     FROM refund_request rr
     JOIN customer_order co ON rr.order_id = co.order_id
     LEFT JOIN cashier c ON rr.requested_by = c.cashier_id
     LEFT JOIN admin a ON rr.approved_by = a.admin_id
     WHERE rr.refund_id = ?`,
    [id]
  ));

  if (!refund) {
    throw new AppError('Refund request not found', 404);
  }

  res.json(successResponse('Refund details retrieved', refund));
};

// Approve refund (admin only)
export const approveRefund = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reference_number, notes } = req.body;
  const admin_id = req.user?.id;

  await query(
    `UPDATE refund_request
     SET refund_status = 'approved',
         approved_by = ?,
         reference_number = ?,
         notes = ?,
         processed_at = NOW()
     WHERE refund_id = ?`,
    [admin_id, reference_number || null, notes || null, id]
  );

  res.json(successResponse('Refund approved'));
};

// Reject refund (admin only)
export const rejectRefund = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  const admin_id = req.user?.id;

  await query(
    `UPDATE refund_request
     SET refund_status = 'rejected',
         approved_by = ?,
         notes = ?,
         processed_at = NOW()
     WHERE refund_id = ?`,
    [admin_id, notes || null, id]
  );

  res.json(successResponse('Refund rejected'));
};

// Complete refund
export const completeRefund = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reference_number } = req.body;

  // Get refund details
  const refund = getFirstRow<any>(await query(
    'SELECT * FROM refund_request WHERE refund_id = ?',
    [id]
  ));

  if (!refund) {
    throw new AppError('Refund request not found', 404);
  }

  if (refund.refund_status !== 'approved') {
    throw new AppError('Refund must be approved before completion', 400);
  }

  // Update refund status
  await query(
    `UPDATE refund_request
     SET refund_status = 'completed',
         reference_number = ?,
         processed_at = NOW()
     WHERE refund_id = ?`,
    [reference_number || refund.reference_number, id]
  );

  // Update order payment status if full refund
  if (refund.refund_type === 'full') {
    await query(
      'UPDATE customer_order SET payment_status = \'refunded\' WHERE order_id = ?',
      [refund.order_id]
    );
  }

  res.json(successResponse('Refund completed'));
};
