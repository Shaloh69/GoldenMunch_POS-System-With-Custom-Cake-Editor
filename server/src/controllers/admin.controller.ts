import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, callProcedure } from '../config/database';
import { successResponse, buildSafeUpdateQuery, validateDateRange } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';
import { uploadProductImage, replaceProductImage } from '../utils/supabaseUpload';

// ==== MENU MANAGEMENT ====

// Create menu item
export const createMenuItem = async (req: AuthRequest, res: Response) => {
  const itemData = req.body;

  // Upload image to Supabase if provided
  let imageUrl = null;
  if (req.file) {
    const uploadResult = await uploadProductImage(req.file);
    if (!uploadResult.success) {
      throw new AppError(uploadResult.error || 'Failed to upload image', 400);
    }
    imageUrl = uploadResult.url;
  }

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
      itemData.stock_quantity || 100,
      itemData.is_infinite_stock !== undefined ? itemData.is_infinite_stock : true,
      itemData.min_stock_level || 5,
      itemData.can_customize || false,
      itemData.can_preorder || false,
      itemData.preparation_time_minutes || 0,
      itemData.supplier_id || null,
      itemData.is_featured || false,
      itemData.allergen_info || null,
      itemData.nutritional_info || null,
      imageUrl,
    ]
  );

  const menuItemId = getInsertId(result);
  res.status(201).json(successResponse('Menu item created', { menu_item_id: menuItemId }));
};

// Update menu item
export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Handle image upload if a new file is provided
  if (req.file) {
    // Get existing image URL
    const existingItem = await query(
      'SELECT image_url FROM menu_item WHERE menu_item_id = ?',
      [id]
    );
    const oldImageUrl = getFirstRow<any>(existingItem)?.image_url || null;

    // Upload new image and delete old one
    const uploadResult = await replaceProductImage(oldImageUrl, req.file);
    if (!uploadResult.success) {
      throw new AppError(uploadResult.error || 'Failed to upload image', 400);
    }
    updates.image_url = uploadResult.url;
  }

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

  await query('UPDATE menu_item SET status = ? WHERE menu_item_id = ?', ['discontinued', id]);

  res.json(successResponse('Menu item deleted'));
};

// Add item price
export const addItemPrice = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, unit_price, valid_from, valid_until, price_type } = req.body;
  const admin_id = req.user?.id;

  await query(
    `INSERT INTO menu_item_price
     (menu_item_id, unit_price, valid_from, valid_until, price_type, is_active)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [menu_item_id, unit_price, valid_from, valid_until, price_type || 'base']
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
     (menu_item_id, transaction_type, quantity, reason_id, notes, performed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [menu_item_id, transaction_type, quantity, reason_id, notes, admin_id]
  );

  res.json(successResponse('Inventory adjusted'));
};

// Get inventory transactions
export const getInventoryTransactions = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, transaction_type, date_from, date_to, page = '1', limit = '50' } = req.query;

  // Parse and validate pagination parameters
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT it.*, mi.name as item_name, mi.unit_of_measure,
           sar.reason_description,
           CONCAT(a.name) as performed_by_name
    FROM inventory_transaction it
    JOIN menu_item mi ON it.menu_item_id = mi.menu_item_id
    LEFT JOIN stock_adjustment_reason sar ON it.reason_id = sar.reason_id
    LEFT JOIN admin a ON it.performed_by = a.admin_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (menu_item_id) {
    sql += ' AND it.menu_item_id = ?';
    params.push(menu_item_id);
  }

  if (transaction_type) {
    sql += ' AND it.transaction_type = ?';
    params.push(transaction_type);
  }

  if (date_from) {
    sql += ' AND DATE(it.created_at) >= ?';
    params.push(date_from);
  }

  if (date_to) {
    sql += ' AND DATE(it.created_at) <= ?';
    params.push(date_to);
  }

  // Get total count
  const countSql = sql.replace(/SELECT it\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = getFirstRow<any>(await query(countSql, params));
  const total = countResult?.total || 0;

  sql += ' ORDER BY it.created_at DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const transactions = await query(sql, params);

  res.json(successResponse('Inventory transactions retrieved', {
    transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  }));
};

// ==== ANALYTICS & REPORTS ====

// Get sales analytics
export const getSalesAnalytics = async (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query;

  // Validate date range - if not provided, default to last 7 days
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const startDate = start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  validateDateRange(startDate as string, endDate as string, 365);

  const sql = `
    SELECT
      DATE(COALESCE(order_datetime, created_at)) as date,
      COUNT(*) as total_orders,
      COUNT(DISTINCT customer_id) as unique_customers,
      SUM(COALESCE(final_amount, total_amount)) as total_revenue,
      AVG(COALESCE(final_amount, total_amount)) as avg_order_value,
      SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
      SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders
    FROM customer_order
    WHERE DATE(COALESCE(order_datetime, created_at)) BETWEEN ? AND ?
      AND is_deleted = FALSE
    GROUP BY DATE(COALESCE(order_datetime, created_at))
    ORDER BY date DESC
  `;

  const analytics = await query(sql, [startDate, endDate]);

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

export const getPromotionById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const promotion = getFirstRow<any>(await query(
    'SELECT * FROM promotion_rules WHERE promotion_id = ?',
    [id]
  ));

  if (!promotion) {
    throw new AppError('Promotion not found', 404);
  }

  res.json(successResponse('Promotion retrieved', promotion));
};

// ==== CATEGORIES ====

// Create category
export const createCategory = async (req: AuthRequest, res: Response) => {
  const { name, description, display_order } = req.body;
  const admin_id = req.user?.id;

  // Upload image to Supabase if provided
  let imageUrl = null;
  if (req.file) {
    const uploadResult = await uploadProductImage(req.file);
    if (!uploadResult.success) {
      throw new AppError(uploadResult.error || 'Failed to upload image', 400);
    }
    imageUrl = uploadResult.url;
  }

  const result = await query(
    'INSERT INTO category (name, description, image_url, display_order, admin_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, imageUrl, display_order || 0, admin_id]
  );

  res.status(201).json(successResponse('Category created', { id: getInsertId(result) }));
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Handle image upload if a new file is provided
  if (req.file) {
    // Get existing image URL
    const existingCategory = await query(
      'SELECT image_url FROM category WHERE category_id = ?',
      [id]
    );
    const oldImageUrl = getFirstRow<any>(existingCategory)?.image_url || null;

    // Upload new image and delete old one
    const uploadResult = await replaceProductImage(oldImageUrl, req.file);
    if (!uploadResult.success) {
      throw new AppError(uploadResult.error || 'Failed to upload image', 400);
    }
    updates.image_url = uploadResult.url;
  }

  const allowedColumns = ['name', 'description', 'image_url', 'display_order', 'is_active'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE category SET ${setClause} WHERE category_id = ?`, [...values, id]);

  res.json(successResponse('Category updated'));
};

// Delete category
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // First, unassign all items from this category
  await query(
    `DELETE FROM category_has_menu_item WHERE category_id = ?`,
    [id]
  );

  // Then delete the category
  await query(
    `DELETE FROM category WHERE category_id = ?`,
    [id]
  );

  res.json(successResponse('Category deleted successfully'));
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

// Unassign item from category
export const unassignItemFromCategory = async (req: AuthRequest, res: Response) => {
  const { category_id, menu_item_id } = req.body;

  await query(
    `DELETE FROM category_has_menu_item
     WHERE category_id = ? AND menu_item_id = ?`,
    [category_id, menu_item_id]
  );

  res.json(successResponse('Item unassigned from category'));
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
    SELECT cf.*, co.order_number, c.name
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
