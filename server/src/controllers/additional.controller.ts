import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query } from '../config/database';
import { successResponse, buildSafeUpdateQuery, validateDateRange } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getAllRows, getInsertId, parseQueryNumber, parseQueryString, parseQueryBoolean } from '../utils/typeGuards';
import bcrypt from 'bcrypt';

// ==== CUSTOMER MANAGEMENT ====

export const createCustomer = async (req: AuthRequest, res: Response) => {
  const { name, phone, email } = req.body as {
    name: string;
    phone: string;
    email?: string;
  };

  const result = await query(
    `INSERT INTO customer (name, phone, email)
     VALUES (?, ?, ?)`,
    [name, phone, email || null]
  );

  res.status(201).json(successResponse('Customer created', { id: getInsertId(result) }));
};

export const getCustomers = async (req: AuthRequest, res: Response) => {
  const search = parseQueryString(req.query.search);
  const is_active = req.query.is_active;
  const page = Math.max(1, parseQueryNumber(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, parseQueryNumber(req.query.limit, 20)));
  const offset = (page - 1) * limit;

  // Ensure pagination values are valid
  if (!Number.isFinite(limit) || !Number.isFinite(offset) || limit < 1 || offset < 0) {
    throw new AppError('Invalid pagination parameters', 400);
  }

  let sql = 'SELECT * FROM customer WHERE 1=1';
  const params: any[] = [];

  if (search) {
    sql += ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(parseQueryBoolean(is_active));
  }

  // Get total count
  const countSql = 'SELECT COUNT(*) as total FROM customer WHERE 1=1' +
    (search ? ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)` : '') +
    (is_active !== undefined ? ' AND is_active = ?' : '');
  const countParams: any[] = search
    ? [`%${search}%`, `%${search}%`, `%${search}%`]
    : [];
  if (is_active !== undefined) {
    countParams.push(parseQueryBoolean(is_active));
  }
  const countResult = getFirstRow<any>(await query(countSql, countParams));
  const total = countResult?.total || 0;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await query(sql, params);
  const customers = getAllRows(result);

  res.json(successResponse('Customers retrieved', {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }));
};

export const getCustomer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const customer = getFirstRow<any>(await query(
    `SELECT c.*, COUNT(DISTINCT co.order_id) as order_count
     FROM customer c
     LEFT JOIN customer_order co ON c.customer_id = co.customer_id
     WHERE c.customer_id = ?
     GROUP BY c.customer_id`,
    [id]
  ));

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Get recent orders
  const orders = await query(
    `SELECT order_id, order_number, order_datetime, order_status, final_amount
     FROM customer_order
     WHERE customer_id = ? AND is_deleted = FALSE
     ORDER BY order_datetime DESC
     LIMIT 10`,
    [id]
  );

  res.json(successResponse('Customer details retrieved', { ...customer, recent_orders: orders }));
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = ['name', 'phone', 'email', 'address', 'notes', 'is_active'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE customer SET ${setClause} WHERE customer_id = ?`, [...values, id]);

  res.json(successResponse('Customer updated'));
};

// ==== SUPPLIER MANAGEMENT ====

export const createSupplier = async (req: AuthRequest, res: Response) => {
  const { supplier_name, contact_person, phone, email, address } = req.body;

  const result = await query(
    `INSERT INTO suppliers (supplier_name, contact_person, phone, email, address)
     VALUES (?, ?, ?, ?, ?)`,
    [supplier_name, contact_person || null, phone || null, email || null, address || null]
  );

  res.status(201).json(successResponse('Supplier created', { id: getInsertId(result) }));
};

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  const { is_active } = req.query;

  let sql = 'SELECT * FROM suppliers WHERE 1=1';
  const params: any[] = [];

  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active === 'true');
  }

  sql += ' ORDER BY supplier_name ASC';

  const suppliers = await query(sql, params);

  res.json(successResponse('Suppliers retrieved', suppliers));
};

export const getSupplierById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const supplier = getFirstRow<any>(await query(
    'SELECT * FROM suppliers WHERE supplier_id = ?',
    [id]
  ));

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  res.json(successResponse('Supplier retrieved', supplier));
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = ['supplier_name', 'contact_person', 'phone', 'email', 'address', 'is_active'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE suppliers SET ${setClause} WHERE supplier_id = ?`, [...values, id]);

  res.json(successResponse('Supplier updated'));
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await query('UPDATE suppliers SET is_active = FALSE WHERE supplier_id = ?', [id]);

  res.json(successResponse('Supplier deactivated'));
};

// ==== CASHIER MANAGEMENT ====

export const createCashier = async (req: AuthRequest, res: Response) => {
  const { name, cashier_code, pin, phone, email, hourly_rate } = req.body;

  // Hash PIN
  const pin_hash = await bcrypt.hash(pin, 10);

  const result = await query(
    `INSERT INTO cashier (name, cashier_code, pin_hash, phone, email, hourly_rate)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, cashier_code, pin_hash, phone || null, email || null, hourly_rate || null]
  );

  res.status(201).json(successResponse('Cashier created', { id: getInsertId(result) }));
};

export const getCashiers = async (req: AuthRequest, res: Response) => {
  const { is_active } = req.query;

  let sql = 'SELECT cashier_id, name, cashier_code, phone, email, hire_date, hourly_rate, is_active, created_at FROM cashier WHERE 1=1';
  const params: any[] = [];

  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active === 'true');
  }

  sql += ' ORDER BY name ASC';

  const cashiers = await query(sql, params);

  res.json(successResponse('Cashiers retrieved', cashiers));
};

export const getCashierById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const cashier = getFirstRow<any>(await query(
    'SELECT cashier_id, name, cashier_code, phone, email, hire_date, hourly_rate, is_active, created_at FROM cashier WHERE cashier_id = ?',
    [id]
  ));

  if (!cashier) {
    throw new AppError('Cashier not found', 404);
  }

  res.json(successResponse('Cashier retrieved', cashier));
};

export const updateCashier = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { pin, ...updates } = req.body;

  // If PIN is being updated, hash it
  if (pin) {
    updates.pin_hash = await bcrypt.hash(pin, 10);
  }

  const allowedColumns = ['name', 'cashier_code', 'pin_hash', 'phone', 'email', 'hire_date', 'hourly_rate', 'is_active'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE cashier SET ${setClause} WHERE cashier_id = ?`, [...values, id]);

  res.json(successResponse('Cashier updated'));
};

export const deleteCashier = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await query('UPDATE cashier SET is_active = FALSE WHERE cashier_id = ?', [id]);

  res.json(successResponse('Cashier deactivated'));
};

// ==== TAX RULES MANAGEMENT ====

export const createTaxRule = async (req: AuthRequest, res: Response) => {
  const { tax_name, tax_type, tax_rate, is_inclusive, applicable_to, start_date, end_date } = req.body;

  const result = await query(
    `INSERT INTO tax_rules (tax_name, tax_type, tax_rate, is_inclusive, applicable_to, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tax_name, tax_type, tax_rate || 0, is_inclusive || false, applicable_to || 'all', start_date || null, end_date || null]
  );

  res.status(201).json(successResponse('Tax rule created', { id: getInsertId(result) }));
};

export const getTaxRules = async (req: AuthRequest, res: Response) => {
  const { is_active } = req.query;

  let sql = 'SELECT * FROM tax_rules WHERE 1=1';
  const params: any[] = [];

  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active === 'true');
  }

  sql += ' ORDER BY created_at DESC';

  const rules = await query(sql, params);

  res.json(successResponse('Tax rules retrieved', rules));
};

export const getTaxRuleById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const taxRule = getFirstRow<any>(await query(
    'SELECT * FROM tax_rules WHERE tax_id = ?',
    [id]
  ));

  if (!taxRule) {
    throw new AppError('Tax rule not found', 404);
  }

  res.json(successResponse('Tax rule retrieved', taxRule));
};

export const updateTaxRule = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = ['tax_name', 'tax_type', 'tax_rate', 'is_inclusive', 'applicable_to', 'is_active', 'start_date', 'end_date'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE tax_rules SET ${setClause} WHERE tax_id = ?`, [...values, id]);

  res.json(successResponse('Tax rule updated'));
};

// ==== CAKE CUSTOMIZATION MANAGEMENT ====

// Flavors
export const createFlavor = async (req: AuthRequest, res: Response) => {
  const { flavor_name, description, additional_cost, display_order } = req.body;
  const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

  const result = await query(
    'INSERT INTO cake_flavors (flavor_name, description, image_url, additional_cost, display_order) VALUES (?, ?, ?, ?, ?)',
    [flavor_name, description || null, image_url, additional_cost || 0, display_order || 0]
  );

  res.status(201).json(successResponse('Flavor created', { id: getInsertId(result) }));
};

export const getFlavors = async (_req: AuthRequest, res: Response) => {
  const flavors = await query('SELECT * FROM cake_flavors ORDER BY display_order ASC');
  res.json(successResponse('Flavors retrieved', flavors));
};

export const updateFlavor = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.file) {
    updates.image_url = `/uploads/products/${req.file.filename}`;
  }

  const allowedColumns = ['flavor_name', 'description', 'image_url', 'additional_cost', 'is_available', 'display_order'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE cake_flavors SET ${setClause} WHERE flavor_id = ?`, [...values, id]);

  res.json(successResponse('Flavor updated'));
};

// Sizes
export const createSize = async (req: AuthRequest, res: Response) => {
  const { size_name, description, serves_people, diameter_inches, size_multiplier, display_order } = req.body;

  const result = await query(
    `INSERT INTO cake_sizes (size_name, description, serves_people, diameter_inches, size_multiplier, display_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [size_name, description || null, serves_people || null, diameter_inches || null, size_multiplier || 1, display_order || 0]
  );

  res.status(201).json(successResponse('Size created', { id: getInsertId(result) }));
};

export const getSizes = async (_req: AuthRequest, res: Response) => {
  const sizes = await query('SELECT * FROM cake_sizes ORDER BY display_order ASC');
  res.json(successResponse('Sizes retrieved', sizes));
};

export const updateSize = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = ['size_name', 'description', 'serves_people', 'diameter_inches', 'size_multiplier', 'is_available', 'display_order'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE cake_sizes SET ${setClause} WHERE size_id = ?`, [...values, id]);

  res.json(successResponse('Size updated'));
};

// Themes
export const createTheme = async (req: AuthRequest, res: Response) => {
  const { theme_name, description, base_additional_cost, preparation_days, display_order } = req.body;
  const theme_image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

  const result = await query(
    `INSERT INTO custom_cake_theme (theme_name, description, theme_image_url, base_additional_cost, preparation_days, display_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [theme_name, description || null, theme_image_url, base_additional_cost || 0, preparation_days || 3, display_order || 0]
  );

  res.status(201).json(successResponse('Theme created', { id: getInsertId(result) }));
};

export const getThemes = async (_req: AuthRequest, res: Response) => {
  const themes = await query('SELECT * FROM custom_cake_theme ORDER BY display_order ASC');
  res.json(successResponse('Themes retrieved', themes));
};

export const updateTheme = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.file) {
    updates.theme_image_url = `/uploads/products/${req.file.filename}`;
  }

  const allowedColumns = ['theme_name', 'description', 'theme_image_url', 'base_additional_cost', 'preparation_days', 'is_available', 'display_order'];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);
  await query(`UPDATE custom_cake_theme SET ${setClause} WHERE theme_id = ?`, [...values, id]);

  res.json(successResponse('Theme updated'));
};

// ==== KIOSK SETTINGS MANAGEMENT ====

export const getKioskSettings = async (_req: AuthRequest, res: Response) => {
  const settings = await query('SELECT * FROM kiosk_settings ORDER BY setting_key ASC');
  res.json(successResponse('Kiosk settings retrieved', settings));
};

export const updateKioskSetting = async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { setting_value } = req.body;
  const admin_id = req.user?.id;

  await query(
    'UPDATE kiosk_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
    [setting_value, admin_id, key]
  );

  res.json(successResponse('Kiosk setting updated'));
};

export const createKioskSetting = async (req: AuthRequest, res: Response) => {
  const { setting_key, setting_value, setting_type, description } = req.body;
  const admin_id = req.user?.id;

  const result = await query(
    'INSERT INTO kiosk_settings (setting_key, setting_value, setting_type, description, updated_by) VALUES (?, ?, ?, ?, ?)',
    [setting_key, setting_value, setting_type || 'string', description || null, admin_id]
  );

  res.status(201).json(successResponse('Kiosk setting created', { id: getInsertId(result) }));
};

// ==== STOCK ADJUSTMENT REASONS ====

export const getStockReasons = async (_req: AuthRequest, res: Response) => {
  const reasons = await query('SELECT * FROM stock_adjustment_reason WHERE is_active = TRUE ORDER BY reason_code ASC');
  res.json(successResponse('Stock reasons retrieved', reasons));
};

export const createStockReason = async (req: AuthRequest, res: Response) => {
  const { reason_code, reason_description } = req.body;

  const result = await query(
    'INSERT INTO stock_adjustment_reason (reason_code, reason_description) VALUES (?, ?)',
    [reason_code, reason_description]
  );

  res.status(201).json(successResponse('Stock reason created', { id: getInsertId(result) }));
};

// ==== ORDER TIMELINE ====

export const getOrderTimeline = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const timeline = await query(
    `SELECT ot.*, c.name as changed_by_name
     FROM order_timeline ot
     LEFT JOIN cashier c ON ot.changed_by = c.cashier_id
     WHERE ot.order_id = ?
     ORDER BY ot.timestamp ASC`,
    [id]
  );

  res.json(successResponse('Order timeline retrieved', timeline));
};

// ==== STATS VIEWING ====

export const getDailyStats = async (req: AuthRequest, res: Response) => {
  const { start_date, end_date, menu_item_id } = req.query;

  // Validate date range if provided
  if (start_date && end_date) {
    validateDateRange(start_date as string, end_date as string, 365);
  }

  let sql = `
    SELECT mids.*, mi.name as item_name
    FROM menu_item_daily_stats mids
    JOIN menu_item mi ON mids.menu_item_id = mi.menu_item_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (menu_item_id) {
    sql += ' AND mids.menu_item_id = ?';
    params.push(menu_item_id);
  }

  if (start_date) {
    sql += ' AND mids.stats_date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    sql += ' AND mids.stats_date <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY mids.stats_date DESC, mids.daily_revenue DESC';

  const stats = await query(sql, params);

  res.json(successResponse('Daily stats retrieved', stats));
};

export const getPopularityHistory = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, limit = '50' } = req.query;

  // Parse and validate limit parameter
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));

  let sql = `
    SELECT ph.*, mi.name as item_name
    FROM popularity_history ph
    JOIN menu_item mi ON ph.menu_item_id = mi.menu_item_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (menu_item_id) {
    sql += ' AND ph.menu_item_id = ?';
    params.push(menu_item_id);
  }

  sql += ' ORDER BY ph.changed_at DESC LIMIT ?';
  params.push(limitNum);

  const history = await query(sql, params);

  res.json(successResponse('Popularity history retrieved', history));
};
