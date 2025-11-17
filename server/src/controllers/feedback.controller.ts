import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query } from '../config/database';
import { successResponse, validateDateRange } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';

// ==== CUSTOMER FEEDBACK ====

// Submit feedback (for admin/cashier to record customer feedback)
export const submitFeedback = async (req: AuthRequest, res: Response) => {
  const {
    order_id,
    customer_id,
    rating,
    service_rating,
    food_rating,
    cleanliness_rating,
    feedback_text,
    is_anonymous,
  } = req.body;

  // Verify order exists
  const order = getFirstRow<any>(await query(
    'SELECT * FROM customer_order WHERE order_id = ?',
    [order_id]
  ));

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Determine feedback type based on rating
  let feedback_type: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (rating >= 4) {
    feedback_type = 'positive';
  } else if (rating <= 2) {
    feedback_type = 'negative';
  }

  // Create feedback
  const result = await query(
    `INSERT INTO customer_feedback
     (order_id, customer_id, rating, service_rating, food_rating, cleanliness_rating,
      feedback_text, feedback_type, is_anonymous)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order_id,
      customer_id || null,
      rating,
      service_rating || null,
      food_rating || null,
      cleanliness_rating || null,
      feedback_text || null,
      feedback_type,
      is_anonymous || false,
    ]
  );

  res.status(201).json(
    successResponse('Feedback submitted', { id: getInsertId(result) })
  );
};

// Get feedback statistics
export const getFeedbackStats = async (req: AuthRequest, res: Response) => {
  const { date_from, date_to } = req.query;

  // Validate date range
  if (!date_from || !date_to) {
    throw new AppError('date_from and date_to are required', 400);
  }
  validateDateRange(date_from as string, date_to as string, 365);

  const sql = `
    SELECT
      feedback_type,
      COUNT(*) as count,
      AVG(rating) as avg_rating,
      AVG(service_rating) as avg_service_rating,
      AVG(food_rating) as avg_food_rating,
      AVG(cleanliness_rating) as avg_cleanliness_rating
    FROM customer_feedback
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY feedback_type
  `;

  const stats = await query(sql, [date_from, date_to]);

  // Get overall stats
  const overall = getFirstRow<any>(await query(
    `SELECT
       COUNT(*) as total_feedback,
       AVG(rating) as overall_rating,
       AVG(service_rating) as overall_service_rating,
       AVG(food_rating) as overall_food_rating,
       AVG(cleanliness_rating) as overall_cleanliness_rating
     FROM customer_feedback
     WHERE DATE(created_at) BETWEEN ? AND ?`,
    [date_from, date_to]
  ));

  res.json(
    successResponse('Feedback statistics retrieved', {
      by_type: stats,
      overall,
    })
  );
};
