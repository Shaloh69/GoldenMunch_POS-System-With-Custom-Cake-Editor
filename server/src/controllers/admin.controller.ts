import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, callProcedure } from '../config/database';
import { successResponse, buildSafeUpdateQuery, validateDateRange } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';

// ==== MENU MANAGEMENT ====

// Create menu item
export const createMenuItem = async (req: AuthRequest, res: Response) => {
  const itemData = req.body;

  const result = await query(
    `INSERT INTO menu_item
     (name, description, item_type, unit_of_measure, stock_quantity,
      is_infinite_stock, min_stock_level, can_customize, can_preorder,
      preparation_time_minutes, supplier_id, is_featured, allergen_info,
      nutritional_info, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemData.name,
      itemData.description || null,
      itemData.item_type,
      itemData.unit_of_measure || 'piece',
      itemData.stock_quantity || 0,
      itemData.is_infinite_stock || false,
      itemData.min_stock_level || 5,
      itemData.can_customize || false,
      itemData.can_preorder || false,
      itemData.preparation_time_minutes || 0,
      itemData.supplier_id || null,
      itemData.is_featured || false,
      itemData.allergen_info || null,
      itemData.nutritional_info || null,
      req.file?.filename ? `/uploads/products/${req.file.filename}` : null,
    ]
  );

  res.status(201).json(successResponse('Menu item created', { id: getInsertId(result) }));
};

// Update menu item
export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = [
    'name', 'description', 'item_type', 'unit_of_measure', 'stock_quantity',
    'is_infinite_stock', 'min_stock_level', 'status', 'can_customize',
    'can_preorder', 'preparation_time_minutes', 'supplier_id', 'is_featured',
    'allergen_info', 'nutritional_info', 'image_url'
  ];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE menu_item SET ${setClause} WHERE menu_item_id = ?`, [...values, id]);

  res.json(successResponse('Menu item updated'));
};

// Delete menu item (soft delete)
export const deleteMenuItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await query('UPDATE menu_item SET is_deleted = TRUE WHERE menu_item_id = ?', [id]);

  res.json(successResponse('Menu item deleted'));
};

// Add item price
export const addItemPrice = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, price, start_date, end_date, price_type } = req.body;
  const admin_id = req.user?.id;

  await query(
    `INSERT INTO menu_item_price
     (menu_item_id, price, start_date, end_date, price_type, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [menu_item_id, price, start_date, end_date, price_type || 'regular', admin_id]
  );

  res.status(201).json(successResponse('Price added'));
};

// ==== INVENTORY MANAGEMENT ====

// Get inventory alerts
export const getInventoryAlerts = async (req: AuthRequest, res: Response) => {
  const { is_acknowledged } = req.query;

  let sql = `
    SELECT ia.*, mi.name as item_name
    FROM inventory_alert ia
    JOIN menu_item mi ON ia.menu_item_id = mi.menu_item_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (is_acknowledged !== undefined) {
    sql += ` AND ia.is_acknowledged = ?`;
    params.push(is_acknowledged === 'true');
  }

  sql += ` ORDER BY ia.created_at DESC`;

  const alerts = await query(sql, params);

  res.json(successResponse('Inventory alerts retrieved', alerts));
};

// Acknowledge alert
export const acknowledgeAlert = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const admin_id = req.user?.id;

  await query(
    'UPDATE inventory_alert SET is_acknowledged = TRUE, acknowledged_by = ?, acknowledged_at = NOW() WHERE alert_id = ?',
    [admin_id, id]
  );

  res.json(successResponse('Alert acknowledged'));
};

// Adjust inventory
export const adjustInventory = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, quantity, transaction_type, reason_id, notes } = req.body;
  const admin_id = req.user?.id;

  // Get current quantity
  const item = getFirstRow<any>(await query(
    'SELECT stock_quantity FROM menu_item WHERE menu_item_id = ?',
    [menu_item_id]
  ));

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  const previousQuantity = item.stock_quantity;
  const newQuantity = transaction_type === 'in'
    ? previousQuantity + quantity
    : previousQuantity - quantity;

  // Update stock
  await query(
    'UPDATE menu_item SET stock_quantity = ? WHERE menu_item_id = ?',
    [newQuantity, menu_item_id]
  );

  // Record transaction
  await query(
    `INSERT INTO inventory_transaction
     (menu_item_id, transaction_type, quantity, previous_quantity, new_quantity,
      reason_id, notes, performed_by, performed_by_role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin')`,
    [menu_item_id, transaction_type, quantity, previousQuantity, newQuantity, reason_id, notes, admin_id]
  );

  res.json(successResponse('Inventory adjusted'));
};

// ==== ANALYTICS & REPORTS ====

// Get sales analytics
export const getSalesAnalytics = async (req: AuthRequest, res: Response) => {
  const { date_from, date_to } = req.query;

  // Validate date range
  if (!date_from || !date_to) {
    throw new AppError('date_from and date_to are required', 400);
  }
  validateDateRange(date_from as string, date_to as string, 365);

  const sql = `
    SELECT
      DATE(order_datetime) as date,
      COUNT(*) as total_orders,
      SUM(final_amount) as total_revenue,
      AVG(final_amount) as avg_order_value,
      SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
      SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders
    FROM customer_order
    WHERE is_deleted = FALSE
      AND DATE(order_datetime) BETWEEN ? AND ?
    GROUP BY DATE(order_datetime)
    ORDER BY date DESC
  `;

  const analytics = await query(sql, [date_from, date_to]);

  res.json(successResponse('Sales analytics retrieved', analytics));
};

// Get trending items
export const getTrendingItems = async (req: AuthRequest, res: Response) => {
  const { days = 7, limit = 10 } = req.query;

  const result = await callProcedure('GetTrendingItems', [days, limit]);

  res.json(successResponse('Trending items retrieved', result[0]));
};

// Get waste report
export const getWasteReport = async (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query;

  const result = await callProcedure('GetWasteReport', [start_date, end_date]);

  res.json(successResponse('Waste report retrieved', result[0]));
};

// Recalculate popularity
export const recalculatePopularity = async (req: AuthRequest, res: Response) => {
  const { days = 30 } = req.body;

  const result = await callProcedure('RecalculatePopularityScore', [days]);

  res.json(successResponse('Popularity recalculated', result[0]));
};

// ==== PROMOTIONS ====

// Create promotion
export const createPromotion = async (req: AuthRequest, res: Response) => {
  const promoData = req.body;
  const admin_id = req.user?.id;

  const result = await query(
    `INSERT INTO promotion_rules
     (promotion_name, description, promotion_type, discount_percentage,
      discount_amount, min_purchase_amount, start_date, end_date,
      start_time, end_time, display_on_kiosk, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      promoData.promotion_name,
      promoData.description,
      promoData.promotion_type,
      promoData.discount_percentage || 0,
      promoData.discount_amount || 0,
      promoData.min_purchase_amount || 0,
      promoData.start_date,
      promoData.end_date,
      promoData.start_time || '00:00:00',
      promoData.end_time || '23:59:59',
      promoData.display_on_kiosk !== false,
      admin_id,
    ]
  );

  res.status(201).json(successResponse('Promotion created', { id: getInsertId(result) }));
};

// Get all promotions
export const getPromotions = async (req: AuthRequest, res: Response) => {
  const { is_active } = req.query;

  let sql = 'SELECT * FROM promotion_rules WHERE 1=1';
  const params: any[] = [];

  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active === 'true');
  }

  sql += ' ORDER BY created_at DESC';

  const promotions = await query(sql, params);

  res.json(successResponse('Promotions retrieved', promotions));
};

// ==== CATEGORIES ====

// Create category
export const createCategory = async (req: AuthRequest, res: Response) => {
  const { name, description, display_order } = req.body;
  const admin_id = req.user?.id;
  const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

  const result = await query(
    'INSERT INTO category (name, description, image_url, display_order, admin_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, image_url, display_order || 0, admin_id]
  );

  res.status(201).json(successResponse('Category created', { id: getInsertId(result) }));
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = ['name', 'description', 'image_url', 'display_order', 'is_active'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE category SET ${setClause} WHERE category_id = ?`, [...values, id]);

  res.json(successResponse('Category updated'));
};

// Assign item to category
export const assignItemToCategory = async (req: AuthRequest, res: Response) => {
  const { category_id, menu_item_id, display_order } = req.body;

  await query(
    `INSERT INTO category_has_menu_item (category_id, menu_item_id, display_order)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE display_order = ?`,
    [category_id, menu_item_id, display_order || 0, display_order || 0]
  );

  res.json(successResponse('Item assigned to category'));
};

// ==== CUSTOMER FEEDBACK ====

// Get feedback
export const getFeedback = async (req: AuthRequest, res: Response) => {
  const { feedback_type, rating_min, date_from, date_to } = req.query;

  // Validate date range if provided
  if (date_from && date_to) {
    validateDateRange(date_from as string, date_to as string, 365);
  }

  let sql = `
    SELECT cf.*, co.order_number, c.first_name, c.last_name
    FROM customer_feedback cf
    JOIN customer_order co ON cf.order_id = co.order_id
    LEFT JOIN customer c ON cf.customer_id = c.customer_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (feedback_type) {
    sql += ' AND cf.feedback_type = ?';
    params.push(feedback_type);
  }

  if (rating_min) {
    sql += ' AND cf.rating >= ?';
    params.push(rating_min);
  }

  if (date_from) {
    sql += ' AND DATE(cf.created_at) >= ?';
    params.push(date_from);
  }

  if (date_to) {
    sql += ' AND DATE(cf.created_at) <= ?';
    params.push(date_to);
  }

  sql += ' ORDER BY cf.created_at DESC';

  const feedback = await query(sql, params);

  res.json(successResponse('Feedback retrieved', feedback));
};

// Respond to feedback
export const respondToFeedback = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { response_text } = req.body;
  const admin_id = req.user?.id;

  await query(
    'UPDATE customer_feedback SET response_text = ?, responded_by = ?, responded_at = NOW() WHERE feedback_id = ?',
    [response_text, admin_id, id]
  );

  res.json(successResponse('Response added to feedback'));
};
