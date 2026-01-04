import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, transaction } from '../config/database';
import { successResponse, validateDateRange } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';
import { PoolConnection } from 'mysql2/promise';

// ==== WASTE TRACKING ====

// Create waste entry
export const createWasteEntry = async (req: AuthRequest, res: Response) => {
  const {
    menu_item_id,
    quantity_wasted,
    waste_reason,
    waste_cost,
    reason_details,
    waste_date,
  } = req.body;
  const cashier_id = req.user?.id;

  const wasteId = await transaction(async (conn: PoolConnection) => {
    // Lock and get menu item to prevent race condition
    const [itemRows] = await conn.query(
      'SELECT * FROM menu_item WHERE menu_item_id = ? FOR UPDATE',
      [menu_item_id]
    );

    const item = getFirstRow<any>(itemRows);

    if (!item) {
      throw new AppError('Menu item not found', 404);
    }

    const previousQuantity = item.stock_quantity;
    const newQuantity = item.is_infinite_stock ? previousQuantity : previousQuantity - quantity_wasted;

    // Create waste entry
    const [wasteResult] = await conn.query(
      `INSERT INTO waste_tracking
       (menu_item_id, quantity, waste_reason, estimated_value, notes, recorded_by, waste_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        menu_item_id,
        quantity_wasted,
        waste_reason,
        waste_cost,
        reason_details || null,
        cashier_id,
        waste_date || new Date().toISOString().slice(0, 10),
      ]
    );

    // Update inventory (only if not infinite stock)
    if (!item.is_infinite_stock) {
      await conn.query(
        `UPDATE menu_item
         SET stock_quantity = ?
         WHERE menu_item_id = ?`,
        [newQuantity, menu_item_id]
      );

      // Auto-update status to 'sold_out' if stock reaches 0
      if (newQuantity === 0) {
        await conn.query(
          'UPDATE menu_item SET status = ? WHERE menu_item_id = ? AND status != ?',
          ['sold_out', menu_item_id, 'discontinued']
        );
        console.log(`📦 Auto-updated status to 'sold_out' for ${item.name} due to waste (stock: 0)`);
      }
    }

    // Record inventory transaction
    await conn.query(
      `INSERT INTO inventory_transaction
       (menu_item_id, transaction_type, quantity, previous_quantity, new_quantity,
        notes, performed_by, performed_by_role)
       VALUES (?, 'waste', ?, ?, ?, ?, ?, 'cashier')`,
      [
        menu_item_id,
        quantity_wasted,
        previousQuantity,
        newQuantity,
        `Waste entry: ${waste_reason}`,
        cashier_id,
      ]
    );

    return (wasteResult as any).insertId;
  });

  res.status(201).json(
    successResponse('Waste entry created', { id: wasteId })
  );
};

// Get waste entries
export const getWasteEntries = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, waste_reason, date_from, date_to, page = '1', limit = '20' } = req.query;

  // Parse and validate pagination parameters
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  // Validate date range if provided
  if (date_from && date_to) {
    validateDateRange(date_from as string, date_to as string, 365);
  }

  let sql = `
    SELECT wt.*, mi.name as item_name, c.name as reported_by_name
    FROM waste_tracking wt
    JOIN menu_item mi ON wt.menu_item_id = mi.menu_item_id
    LEFT JOIN cashier c ON wt.reported_by = c.cashier_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (menu_item_id) {
    sql += ' AND wt.menu_item_id = ?';
    params.push(menu_item_id);
  }

  if (waste_reason) {
    sql += ' AND wt.waste_reason = ?';
    params.push(waste_reason);
  }

  if (date_from) {
    sql += ' AND wt.waste_date >= ?';
    params.push(date_from);
  }

  if (date_to) {
    sql += ' AND wt.waste_date <= ?';
    params.push(date_to);
  }

  // Get total count
  const countSql = sql.replace(/SELECT wt\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = getFirstRow<any>(await query(countSql, params));
  const total = countResult?.total || 0;

  sql += ' ORDER BY wt.waste_date DESC, wt.created_at DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const entries = await query(sql, params);

  res.json(successResponse('Waste entries retrieved', {
    entries,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  }));
};

// Get waste summary
export const getWasteSummary = async (req: AuthRequest, res: Response) => {
  const { date_from, date_to } = req.query;

  // Validate date range
  if (!date_from || !date_to) {
    throw new AppError('date_from and date_to are required', 400);
  }
  validateDateRange(date_from as string, date_to as string, 365);

  const sql = `
    SELECT
      waste_reason,
      COUNT(*) as total_incidents,
      SUM(quantity_wasted) as total_quantity,
      SUM(waste_cost) as total_cost
    FROM waste_tracking
    WHERE waste_date BETWEEN ? AND ?
    GROUP BY waste_reason
    ORDER BY total_cost DESC
  `;

  const summary = await query(sql, [date_from, date_to]);

  res.json(successResponse('Waste summary retrieved', summary));
};
