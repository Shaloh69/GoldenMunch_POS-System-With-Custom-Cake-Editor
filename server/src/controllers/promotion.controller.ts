import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, callProcedure } from '../config/database';
import { successResponse, buildSafeUpdateQuery, validateDateRange } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow } from '../utils/typeGuards';

// ==== PROMOTION ASSIGNMENT ====

// Assign items to promotion
export const assignItemsToPromotion = async (req: AuthRequest, res: Response) => {
  const { promotion_id, menu_item_ids } = req.body;

  // Verify promotion exists
  const promotion = getFirstRow<any>(await query(
    'SELECT * FROM promotion_rules WHERE promotion_id = ?',
    [promotion_id]
  ));

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  // Delete existing assignments
  await query(
    'DELETE FROM promotion_applicable_items WHERE promotion_id = ?',
    [promotion_id]
  );

  // Insert new assignments
  if (menu_item_ids && menu_item_ids.length > 0) {
    const values = menu_item_ids.map((item_id: number) => [promotion_id, item_id]);
    const placeholders = values.map(() => '(?, ?)').join(', ');

    await query(
      `INSERT INTO promotion_applicable_items (promotion_id, menu_item_id) VALUES ${placeholders}`,
      values.flat()
    );
  }

  res.json(successResponse('Items assigned to promotion'));
};

// Assign categories to promotion
export const assignCategoriesToPromotion = async (req: AuthRequest, res: Response) => {
  const { promotion_id, category_ids } = req.body;

  // Verify promotion exists
  const promotion = getFirstRow<any>(await query(
    'SELECT * FROM promotion_rules WHERE promotion_id = ?',
    [promotion_id]
  ));

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  // Delete existing assignments
  await query(
    'DELETE FROM promotion_applicable_categories WHERE promotion_id = ?',
    [promotion_id]
  );

  // Insert new assignments
  if (category_ids && category_ids.length > 0) {
    const values = category_ids.map((cat_id: number) => [promotion_id, cat_id]);
    const placeholders = values.map(() => '(?, ?)').join(', ');

    await query(
      `INSERT INTO promotion_applicable_categories (promotion_id, category_id) VALUES ${placeholders}`,
      values.flat()
    );
  }

  res.json(successResponse('Categories assigned to promotion'));
};

// Get promotion assignments
export const getPromotionAssignments = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get assigned items
  const items = await query(
    `SELECT pai.*, mi.name as item_name
     FROM promotion_applicable_items pai
     JOIN menu_item mi ON pai.menu_item_id = mi.menu_item_id
     WHERE pai.promotion_id = ?`,
    [id]
  );

  // Get assigned categories
  const categories = await query(
    `SELECT pac.*, c.name as category_name
     FROM promotion_applicable_categories pac
     JOIN category c ON pac.category_id = c.category_id
     WHERE pac.promotion_id = ?`,
    [id]
  );

  res.json(
    successResponse('Promotion assignments retrieved', { items, categories })
  );
};

// Update promotion
export const updatePromotion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = [
    'promotion_name', 'description', 'promotion_type', 'discount_percentage',
    'discount_amount', 'min_purchase_amount', 'min_quantity', 'buy_quantity',
    'get_quantity', 'start_date', 'end_date', 'start_time', 'end_time',
    'max_uses_per_customer', 'total_usage_limit', 'is_active', 'is_stackable',
    'display_on_kiosk'
  ];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE promotion_rules SET ${setClause} WHERE promotion_id = ?`, [...values, id]);

  res.json(successResponse('Promotion updated'));
};

// Delete/deactivate promotion
export const deletePromotion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await query('UPDATE promotion_rules SET is_active = FALSE WHERE promotion_id = ?', [id]);

  res.json(successResponse('Promotion deactivated'));
};

// Get promotion usage log
export const getPromotionUsageLog = async (req: AuthRequest, res: Response) => {
  const { promotion_id, date_from, date_to, page = 1, limit = 20 } = req.query;

  // Validate date range if provided
  if (date_from && date_to) {
    validateDateRange(date_from as string, date_to as string, 365);
  }

  let sql = `
    SELECT pul.*, co.order_number, cust.first_name, cust.last_name
    FROM promotion_usage_log pul
    JOIN customer_order co ON pul.order_id = co.order_id
    LEFT JOIN customer cust ON pul.customer_id = cust.customer_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (promotion_id) {
    sql += ' AND pul.promotion_id = ?';
    params.push(promotion_id);
  }

  if (date_from) {
    sql += ' AND DATE(pul.used_at) >= ?';
    params.push(date_from);
  }

  if (date_to) {
    sql += ' AND DATE(pul.used_at) <= ?';
    params.push(date_to);
  }

  // Get total count
  const countSql = sql.replace(/SELECT pul\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = getFirstRow<any>(await query(countSql, params.slice(0, -2)));
  const total = countResult?.total || 0;

  sql += ' ORDER BY pul.used_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const logs = await query(sql, params);

  res.json(successResponse('Promotion usage log retrieved', {
    logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  }));
};

// Apply promotion to order (called during order calculation)
export const getApplicablePromotions = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, order_total } = req.query;

  const result = await callProcedure('GetActivePromotions', [
    menu_item_id,
    order_total,
  ]);

  res.json(successResponse('Applicable promotions retrieved', result[0]));
};
