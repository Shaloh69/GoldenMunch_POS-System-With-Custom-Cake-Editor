import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';

// Get all customer discount types
export const getDiscountTypes = async (req: AuthRequest, res: Response) => {
  const { include_inactive } = req.query;

  let sql = 'SELECT * FROM customer_discount_type';

  if (!include_inactive || include_inactive === 'false') {
    sql += ' WHERE is_active = TRUE';
  }

  sql += ' ORDER BY discount_percentage DESC, name ASC';

  const discountTypes = await query(sql);
  res.json(successResponse('Discount types retrieved', discountTypes));
};

// Get active discount types (for cashier use)
export const getActiveDiscountTypes = async (req: AuthRequest, res: Response) => {
  const sql = `
    SELECT
      discount_type_id,
      name,
      description,
      discount_percentage,
      requires_id
    FROM customer_discount_type
    WHERE is_active = TRUE
    ORDER BY discount_percentage DESC, name ASC
  `;

  const discountTypes = await query(sql);
  res.json(successResponse('Active discount types retrieved', discountTypes));
};

// Get single discount type by ID
export const getDiscountTypeById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM customer_discount_type WHERE discount_type_id = ?';
  const discountTypes = await query(sql, [id]);

  if (!discountTypes || discountTypes.length === 0) {
    throw new AppError('Discount type not found', 404);
  }

  res.json(successResponse('Discount type retrieved', discountTypes[0]));
};

// Create new discount type (Admin only)
export const createDiscountType = async (req: AuthRequest, res: Response) => {
  const {
    name,
    description,
    discount_percentage,
    requires_id = true,
    is_active = true
  } = req.body;

  // Validate required fields
  if (!name || discount_percentage === undefined || discount_percentage === null) {
    throw new AppError('Name and discount percentage are required', 400);
  }

  // Validate discount percentage
  if (discount_percentage < 0 || discount_percentage > 100) {
    throw new AppError('Discount percentage must be between 0 and 100', 400);
  }

  const created_by = req.user?.admin_id || req.user?.cashier_id;
  if (!created_by) {
    throw new AppError('User not authenticated', 401);
  }

  const sql = `
    INSERT INTO customer_discount_type
    (name, description, discount_percentage, requires_id, is_active, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const result = await query(sql, [
    name.trim(),
    description?.trim() || null,
    discount_percentage,
    requires_id,
    is_active,
    created_by
  ]);

  const insertId = (result as any).insertId;

  // Fetch the created discount type
  const newDiscountType = await query(
    'SELECT * FROM customer_discount_type WHERE discount_type_id = ?',
    [insertId]
  );

  res.status(201).json(successResponse('Discount type created successfully', newDiscountType[0]));
};

// Update discount type (Admin only)
export const updateDiscountType = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    description,
    discount_percentage,
    requires_id,
    is_active
  } = req.body;

  // Check if discount type exists
  const existing = await query(
    'SELECT * FROM customer_discount_type WHERE discount_type_id = ?',
    [id]
  );

  if (!existing || existing.length === 0) {
    throw new AppError('Discount type not found', 404);
  }

  // Validate discount percentage if provided
  if (discount_percentage !== undefined && (discount_percentage < 0 || discount_percentage > 100)) {
    throw new AppError('Discount percentage must be between 0 and 100', 400);
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name.trim());
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description?.trim() || null);
  }
  if (discount_percentage !== undefined) {
    updates.push('discount_percentage = ?');
    values.push(discount_percentage);
  }
  if (requires_id !== undefined) {
    updates.push('requires_id = ?');
    values.push(requires_id);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  // Add updated_at timestamp
  updates.push('updated_at = CURRENT_TIMESTAMP');

  // Add ID to values
  values.push(id);

  const sql = `
    UPDATE customer_discount_type
    SET ${updates.join(', ')}
    WHERE discount_type_id = ?
  `;

  await query(sql, values);

  // Fetch updated discount type
  const updatedDiscountType = await query(
    'SELECT * FROM customer_discount_type WHERE discount_type_id = ?',
    [id]
  );

  res.json(successResponse('Discount type updated successfully', updatedDiscountType[0]));
};

// Delete (deactivate) discount type (Admin only)
export const deleteDiscountType = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if discount type exists
  const existing = await query(
    'SELECT * FROM customer_discount_type WHERE discount_type_id = ?',
    [id]
  );

  if (!existing || existing.length === 0) {
    throw new AppError('Discount type not found', 404);
  }

  // Soft delete by setting is_active to false
  const sql = 'UPDATE customer_discount_type SET is_active = FALSE WHERE discount_type_id = ?';
  await query(sql, [id]);

  res.json(successResponse('Discount type deactivated successfully'));
};

// Get discount usage statistics
export const getDiscountStats = async (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query;

  const sql = `
    SELECT
      cdt.discount_type_id,
      cdt.name,
      cdt.discount_percentage,
      COUNT(co.order_id) as usage_count,
      SUM(co.discount_amount) as total_discount_amount,
      AVG(co.discount_amount) as avg_discount_amount
    FROM customer_discount_type cdt
    LEFT JOIN customer_order co ON cdt.discount_type_id = co.customer_discount_type_id
      ${start_date && end_date ? 'AND co.created_at BETWEEN ? AND ?' : ''}
    WHERE cdt.is_active = TRUE
    GROUP BY cdt.discount_type_id, cdt.name, cdt.discount_percentage
    ORDER BY usage_count DESC
  `;

  const params = start_date && end_date ? [start_date, end_date] : [];
  const stats = await query(sql, params);

  res.json(successResponse('Discount statistics retrieved', stats));
};
