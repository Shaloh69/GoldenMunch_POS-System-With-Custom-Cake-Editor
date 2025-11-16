import { Response } from 'express';
import { AuthRequest, CreateOrderRequest, OrderItemRequest } from '../models/types';
import { query, transaction, callProcedure } from '../config/database';
import { successResponse, calculateOrderTotal, generateSessionId } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { PoolConnection } from 'mysql2/promise';

// Create order (from kiosk or cashier)
export const createOrder = async (req: AuthRequest, res: Response) => {
  const orderData: CreateOrderRequest = req.body;

  const result = await transaction(async (conn: PoolConnection) => {
    // Calculate order total
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of orderData.items) {
      // Get item price
      const [menuItem] = await conn.query(
        `SELECT mi.*,
          (SELECT price FROM menu_item_price
           WHERE menu_item_id = mi.menu_item_id
           AND is_active = TRUE
           AND CURDATE() BETWEEN start_date AND end_date
           ORDER BY price_type = 'regular' DESC
           LIMIT 1) as current_price
         FROM menu_item mi
         WHERE mi.menu_item_id = ? AND mi.is_deleted = FALSE`,
        [item.menu_item_id]
      );

      const menuItemData: any = Array.isArray(menuItem) ? menuItem[0] : menuItem;

      if (!menuItemData) {
        throw new AppError(`Menu item ${item.menu_item_id} not found`, 404);
      }

      let itemPrice = menuItemData.current_price || 0;
      let flavorCost = 0;
      let sizeMultiplier = 1;
      let designCost = 0;
      let designId = null;

      // Handle custom cake design
      if (item.custom_cake_design) {
        // Insert custom cake design
        const [designResult] = await conn.query(
          `INSERT INTO custom_cake_design
           (theme_id, frosting_color, frosting_type, decoration_details,
            cake_text, special_instructions, design_complexity, additional_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            item.custom_cake_design.theme_id || null,
            item.custom_cake_design.frosting_color || null,
            item.custom_cake_design.frosting_type,
            item.custom_cake_design.decoration_details || null,
            item.custom_cake_design.cake_text || null,
            item.custom_cake_design.special_instructions || null,
            item.custom_cake_design.design_complexity,
          ]
        );

        designId = (designResult as any).insertId;

        // Get theme cost if applicable
        if (item.custom_cake_design.theme_id) {
          const [theme] = await conn.query(
            'SELECT base_additional_cost FROM custom_cake_theme WHERE theme_id = ?',
            [item.custom_cake_design.theme_id]
          );
          if (Array.isArray(theme) && theme.length > 0) {
            designCost += theme[0].base_additional_cost || 0;
          }
        }
      }

      // Get flavor cost
      if (item.flavor_id) {
        const [flavor] = await conn.query(
          'SELECT additional_cost FROM cake_flavors WHERE flavor_id = ?',
          [item.flavor_id]
        );
        if (Array.isArray(flavor) && flavor.length > 0) {
          flavorCost = flavor[0].additional_cost || 0;
        }
      }

      // Get size multiplier
      if (item.size_id) {
        const [size] = await conn.query(
          'SELECT size_multiplier FROM cake_sizes WHERE size_id = ?',
          [item.size_id]
        );
        if (Array.isArray(size) && size.length > 0) {
          sizeMultiplier = size[0].size_multiplier || 1;
        }
      }

      const itemTotal = (itemPrice + flavorCost + designCost) * sizeMultiplier * item.quantity;

      orderItems.push({
        menu_item_id: item.menu_item_id,
        custom_cake_design_id: designId,
        flavor_id: item.flavor_id || null,
        size_id: item.size_id || null,
        quantity: item.quantity,
        unit_price: itemPrice,
        flavor_cost: flavorCost,
        size_multiplier: sizeMultiplier,
        design_cost: designCost,
        item_total: itemTotal,
        special_instructions: item.special_instructions || null,
      });

      subtotal += itemTotal;
    }

    // Get applicable tax
    const [taxRule] = await conn.query(
      `SELECT * FROM tax_rules
       WHERE is_active = TRUE
       AND effective_date <= CURDATE()
       ORDER BY effective_date DESC
       LIMIT 1`
    );

    const taxRate = Array.isArray(taxRule) && taxRule.length > 0 ? taxRule[0].tax_rate : 0;

    const totals = calculateOrderTotal(subtotal, taxRate, 0);

    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO customer_order
       (order_number, verification_code, customer_id, order_type, order_source,
        scheduled_pickup_datetime, payment_method, payment_status, order_status,
        total_amount, discount_amount, tax_amount, final_amount,
        special_instructions, kiosk_session_id, is_preorder)
       VALUES ('', '', ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.customer_id || null,
        orderData.order_type,
        orderData.order_source || 'kiosk',
        orderData.scheduled_pickup_datetime || null,
        orderData.payment_method,
        totals.subtotal,
        totals.discount,
        totals.tax,
        totals.total,
        orderData.special_instructions || null,
        orderData.kiosk_session_id || generateSessionId(),
        orderData.order_type === 'pre_order' || orderData.order_type === 'custom_order',
      ]
    );

    const orderId = (orderResult as any).insertId;

    // Get the generated verification code and order number
    const [orderInfo] = await conn.query(
      'SELECT order_number, verification_code FROM customer_order WHERE order_id = ?',
      [orderId]
    );

    const orderNumber = Array.isArray(orderInfo) && orderInfo.length > 0 ? orderInfo[0].order_number : '';
    const verificationCode = Array.isArray(orderInfo) && orderInfo.length > 0 ? orderInfo[0].verification_code : '';

    // Insert order items
    for (const orderItem of orderItems) {
      await conn.query(
        `INSERT INTO order_item
         (order_id, menu_item_id, custom_cake_design_id, flavor_id, size_id,
          quantity, unit_price, flavor_cost, size_multiplier, design_cost,
          item_total, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderItem.menu_item_id,
          orderItem.custom_cake_design_id,
          orderItem.flavor_id,
          orderItem.size_id,
          orderItem.quantity,
          orderItem.unit_price,
          orderItem.flavor_cost,
          orderItem.size_multiplier,
          orderItem.design_cost,
          orderItem.item_total,
          orderItem.special_instructions,
        ]
      );
    }

    return {
      order_id: orderId,
      order_number: orderNumber,
      verification_code: verificationCode,
      total_amount: totals.total,
      items_count: orderItems.length,
    };
  });

  res.status(201).json(successResponse('Order created successfully', result));
};

// Get order by verification code
export const getOrderByVerificationCode = async (req: AuthRequest, res: Response) => {
  const { code } = req.params;

  const [order] = await query(
    `SELECT * FROM customer_order
     WHERE verification_code = ?
     AND DATE(order_datetime) = CURDATE()
     AND is_deleted = FALSE`,
    [code]
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Get order items
  const items = await query(
    `SELECT oi.*, mi.name as item_name
     FROM order_item oi
     JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
     WHERE oi.order_id = ?`,
    [order.order_id]
  );

  res.json(successResponse('Order retrieved', { ...order, items }));
};

// Verify payment
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { order_id, reference_number, payment_method } = req.body;
  const cashier_id = req.user?.id;

  if (payment_method === 'gcash') {
    const result = await callProcedure('VerifyGCashPayment', [
      order_id,
      reference_number,
      cashier_id,
    ]);

    res.json(successResponse('Payment verified', result[0][0]));
  } else {
    // Handle other payment methods
    await query(
      `UPDATE customer_order
       SET payment_status = 'paid',
           payment_verified_by = ?,
           payment_verified_at = NOW()
       WHERE order_id = ?`,
      [cashier_id, order_id]
    );

    res.json(successResponse('Payment verified successfully'));
  }
};

// Verify order with code (cashier)
export const verifyOrder = async (req: AuthRequest, res: Response) => {
  const { verification_code } = req.body;
  const cashier_id = req.user?.id;

  const result = await callProcedure('VerifyOrder', [verification_code, cashier_id]);

  res.json(successResponse('Order verified', result[0][0]));
};

// Get order details
export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const [order] = await query(
    'SELECT * FROM customer_order WHERE order_id = ? AND is_deleted = FALSE',
    [id]
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const items = await query(
    `SELECT oi.*, mi.name as item_name, mi.image_url
     FROM order_item oi
     JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
     WHERE oi.order_id = ?`,
    [id]
  );

  res.json(successResponse('Order details retrieved', { ...order, items }));
};

// Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const cashier_id = req.user?.id;

  await query(
    'UPDATE customer_order SET order_status = ?, cashier_id = ? WHERE order_id = ?',
    [status, cashier_id, id]
  );

  res.json(successResponse('Order status updated'));
};

// Get orders list with filters
export const getOrders = async (req: AuthRequest, res: Response) => {
  const {
    status,
    payment_status,
    order_type,
    date_from,
    date_to,
    page = 1,
    limit = 20,
  } = req.query;

  let sql = `
    SELECT co.*, c.first_name, c.last_name, c.phone
    FROM customer_order co
    LEFT JOIN customer c ON co.customer_id = c.customer_id
    WHERE co.is_deleted = FALSE
  `;

  const params: any[] = [];

  if (status) {
    sql += ` AND co.order_status = ?`;
    params.push(status);
  }

  if (payment_status) {
    sql += ` AND co.payment_status = ?`;
    params.push(payment_status);
  }

  if (order_type) {
    sql += ` AND co.order_type = ?`;
    params.push(order_type);
  }

  if (date_from) {
    sql += ` AND DATE(co.order_datetime) >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    sql += ` AND DATE(co.order_datetime) <= ?`;
    params.push(date_to);
  }

  sql += ` ORDER BY co.order_datetime DESC`;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const orders = await query(sql, params);

  res.json(successResponse('Orders retrieved', orders));
};
