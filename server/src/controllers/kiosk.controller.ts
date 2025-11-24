import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, callProcedure } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow } from '../utils/typeGuards';

// Get all available menu items for kiosk
export const getMenuItems = async (req: AuthRequest, res: Response) => {
  const {
    category_id,
    item_type,
    is_featured,
    search,
    page = '1',
    limit = '50',
  } = req.query;

  // Parse and validate pagination parameters
  const parsedPage = parseInt(page as string, 10);
  const parsedLimit = parseInt(limit as string, 10);

  const pageNum = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limitNum = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(100, parsedLimit) : 50;
  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT
      mi.*,
      (SELECT unit_price FROM menu_item_price
       WHERE menu_item_id = mi.menu_item_id
       AND is_active = TRUE
       AND CURDATE() BETWEEN valid_from AND valid_until
       ORDER BY price_type = 'base' DESC, created_at DESC
       LIMIT 1) as current_price
    FROM menu_item mi
    WHERE mi.is_deleted = FALSE
      AND mi.status = 'available'
      AND (mi.is_infinite_stock = TRUE OR mi.stock_quantity > 0)
  `;

  const params: any[] = [];

  if (category_id) {
    const categoryIdNum = parseInt(category_id as string, 10);
    if (!Number.isNaN(categoryIdNum)) {
      sql += ` AND EXISTS (
        SELECT 1 FROM category_has_menu_item
        WHERE menu_item_id = mi.menu_item_id
        AND category_id = ?
      )`;
      params.push(categoryIdNum);
    }
  }

  if (item_type) {
    sql += ` AND mi.item_type = ?`;
    params.push(String(item_type));
  }

  if (is_featured === 'true') {
    sql += ` AND mi.is_featured = TRUE`;
  }

  if (search) {
    sql += ` AND (mi.name LIKE ? OR mi.description LIKE ?)`;
    const searchStr = String(search);
    params.push(`%${searchStr}%`, `%${searchStr}%`);
  }

  sql += ` ORDER BY mi.is_featured DESC, mi.popularity_score DESC`;
  sql += ` LIMIT ? OFFSET ?`;

  // Ensure pagination parameters are valid before adding to params
  if (!Number.isFinite(limitNum) || !Number.isFinite(offset) || limitNum < 1 || offset < 0) {
    throw new AppError('Invalid pagination parameters', 400);
  }

  params.push(limitNum, offset);

  const items = await query(sql, params);

  res.json(successResponse('Menu items retrieved', items));
};

// Get categories
export const getCategories = async (_req: AuthRequest, res: Response) => {
  const sql = `
    SELECT * FROM category
    WHERE is_active = TRUE
    ORDER BY display_order ASC
  `;

  const categories = await query(sql);
  res.json(successResponse('Categories retrieved', categories));
};

// Get item details with customization options
export const getItemDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const item = getFirstRow<any>(await query(
    `SELECT mi.*,
      (SELECT unit_price FROM menu_item_price
       WHERE menu_item_id = mi.menu_item_id
       AND is_active = TRUE
       AND CURDATE() BETWEEN valid_from AND valid_until
       ORDER BY price_type = 'base' DESC
       LIMIT 1) as current_price
     FROM menu_item mi
     WHERE mi.menu_item_id = ? AND mi.is_deleted = FALSE`,
    [id]
  ));

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  // If customizable, get flavors and sizes
  if (item.can_customize) {
    const flavors = await query(
      'SELECT * FROM cake_flavors WHERE is_available = TRUE ORDER BY display_order'
    );
    const sizes = await query(
      'SELECT * FROM cake_sizes WHERE is_available = TRUE ORDER BY display_order'
    );
    const themes = await query(
      'SELECT * FROM custom_cake_theme WHERE is_available = TRUE ORDER BY display_order'
    );

    item.flavors = flavors;
    item.sizes = sizes;
    item.themes = themes;
  }

  res.json(successResponse('Item details retrieved', item));
};

// Check custom cake capacity
export const checkCapacity = async (req: AuthRequest, res: Response) => {
  const { pickup_date, complexity } = req.query;

  const result = await callProcedure('CheckCustomCakeCapacity', [
    pickup_date,
    complexity,
  ]);

  res.json(successResponse('Capacity checked', result[0][0]));
};

// Get active promotions
export const getActivePromotions = async (_req: AuthRequest, res: Response) => {
  const sql = `
    SELECT * FROM promotion_rules
    WHERE is_active = TRUE
      AND display_on_kiosk = TRUE
      AND CURDATE() BETWEEN start_date AND end_date
      AND CURTIME() BETWEEN start_time AND end_time
      AND (total_usage_limit IS NULL OR current_usage_count < total_usage_limit)
    ORDER BY discount_percentage DESC, discount_amount DESC
  `;

  const promotions = await query(sql);
  res.json(successResponse('Active promotions retrieved', promotions));
};
