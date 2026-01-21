import { Response } from 'express';
import { AuthRequest, CreateOrderRequest } from '../models/types';
import { query, transaction, callProcedure } from '../config/database';
import { successResponse, calculateOrderTotal, generateSessionId } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow } from '../utils/typeGuards';
import { PoolConnection } from 'mysql2/promise';
import { sseService, SSEChannels, SSEEvents } from '../services/sse.service';

// In-memory tracking for QR code scans
const scannedQRCodes = new Set<number>();

// Create order (from kiosk or cashier)
export const createOrder = async (req: AuthRequest, res: Response) => {
  const orderData: CreateOrderRequest = req.body;

  const result = await transaction(async (conn: PoolConnection) => {
    // Handle guest customer creation if name/phone provided without customer_id
    let customerId = orderData.customer_id || null;
    if (!customerId && (orderData.customer_name || orderData.customer_phone)) {
      // Create a guest customer record for kiosk orders
      const [customerResult] = await conn.query(
        `INSERT INTO customer (name, phone, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())`,
        [orderData.customer_name || 'Guest', orderData.customer_phone || null]
      );
      customerId = (customerResult as any).insertId;
      console.log(`✓ Created guest customer record (ID: ${customerId}) for kiosk order`);
    }

    // Calculate order total and preparation time
    let subtotal = 0;
    let maxPreparationTime = 0; // Track the longest preparation time (items prepared in parallel)
    const orderItems: any[] = [];

    for (const item of orderData.items) {
      // Get item price and preparation time
      const [menuItem] = await conn.query(
        `SELECT mi.*,
          (SELECT unit_price FROM menu_item_price
           WHERE menu_item_id = mi.menu_item_id
           AND is_active = TRUE
           AND CURDATE() BETWEEN valid_from AND valid_until
           ORDER BY price_type = 'base' DESC
           LIMIT 1) as current_price
         FROM menu_item mi
         WHERE mi.menu_item_id = ?`,
        [item.menu_item_id]
      );

      const menuItemData: any = Array.isArray(menuItem) ? menuItem[0] : menuItem;

      if (!menuItemData) {
        throw new AppError(`Menu item ${item.menu_item_id} not found`, 404);
      }

      // Track maximum preparation time (items are prepared in parallel)
      const itemPrepTime = menuItemData.preparation_time_minutes || 0;
      if (itemPrepTime > maxPreparationTime) {
        maxPreparationTime = itemPrepTime;
      }

      let itemPrice = menuItemData.current_price || 0;
      let flavorCost = 0;
      let sizeMultiplier = 1;
      let customCakeRequestId = null;

      // Get flavor cost (for custom cakes)
      if (item.flavor_id) {
        const [flavorRows] = await conn.query(
          'SELECT base_price_per_tier FROM cake_flavors WHERE flavor_id = ?',
          [item.flavor_id]
        );
        if (Array.isArray(flavorRows) && flavorRows.length > 0) {
          const flavor = flavorRows[0] as any;
          flavorCost = flavor.base_price_per_tier || 0;
        }
      }

      // Get size multiplier (for custom cakes)
      if (item.size_id) {
        const [sizeRows] = await conn.query(
          'SELECT base_price_multiplier FROM cake_sizes WHERE size_id = ?',
          [item.size_id]
        );
        if (Array.isArray(sizeRows) && sizeRows.length > 0) {
          const size = sizeRows[0] as any;
          sizeMultiplier = size.base_price_multiplier || 1;
        }
      }

      const itemTotal = (itemPrice + flavorCost) * sizeMultiplier * item.quantity;

      // Prepare customization notes (for special instructions, cake design details, etc.)
      let customizationNotes = null;
      if (item.custom_cake_design) {
        customizationNotes = JSON.stringify({
          theme_id: item.custom_cake_design.theme_id,
          frosting_color: item.custom_cake_design.frosting_color,
          frosting_type: item.custom_cake_design.frosting_type,
          decoration_details: item.custom_cake_design.decoration_details,
          cake_text: item.custom_cake_design.cake_text,
          design_complexity: item.custom_cake_design.design_complexity,
        });
      }

      orderItems.push({
        menu_item_id: item.menu_item_id,
        custom_cake_request_id: customCakeRequestId,
        item_name: menuItemData.name,
        item_description: menuItemData.description,
        quantity: item.quantity,
        unit_price: itemPrice,
        subtotal: itemTotal,
        customization_notes: customizationNotes,
        special_requests: item.special_instructions || null,
      });

      subtotal += itemTotal;
    }

    // Get applicable tax
    const [taxRuleRows] = await conn.query(
      `SELECT * FROM tax_rules
       WHERE is_active = TRUE
       ORDER BY created_at DESC
       LIMIT 1`
    );

    const taxRate = Array.isArray(taxRuleRows) && taxRuleRows.length > 0 ? (taxRuleRows[0] as any).tax_rate : 0;

    const totals = calculateOrderTotal(subtotal, taxRate, 0);

    // Calculate queue-aware preparation time
    // Get total preparation time from pending/preparing orders
    const [pendingOrdersRows] = await conn.query(
      `SELECT SUM(mi.preparation_time_minutes) as queue_time
       FROM customer_order co
       JOIN order_item oi ON co.order_id = oi.order_id
       JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
       WHERE co.order_status IN ('pending', 'preparing')
       AND co.is_deleted = FALSE
       AND DATE(co.created_at) = CURDATE()`
    );

    const queueTime = (Array.isArray(pendingOrdersRows) && pendingOrdersRows.length > 0)
      ? (pendingOrdersRows[0] as any)?.queue_time || 0
      : 0;

    // Estimated time = queue time + this order's preparation time
    const estimatedPreparationMinutes = Math.ceil(queueTime + maxPreparationTime);

    console.log(`⏱️  Preparation time calculation: Queue: ${queueTime}min + Order: ${maxPreparationTime}min = ${estimatedPreparationMinutes}min`);

    // Generate order number and verification code
    const FrOrderRandSuff = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');

    const orderNumber = `ORD-${FrOrderRandSuff}`;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

    // Get cashier/admin ID if authenticated
    const cashierId = req.user?.id || null;

    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO customer_order
       (order_number, verification_code, customer_id, cashier_id, order_type, payment_method, payment_status, order_status,
        subtotal, total_amount, discount_amount, tax_amount, final_amount,
        special_instructions, kiosk_session_id, is_preorder, payment_reference_number)
       VALUES (?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        verificationCode,
        customerId,
        cashierId,
        orderData.order_type,
        orderData.payment_method,
        totals.subtotal,
        totals.total,
        totals.discount,
        totals.tax,
        totals.total,
        orderData.special_instructions || null,
        orderData.kiosk_session_id || generateSessionId(),
        orderData.order_type === 'custom_order',
        orderData.payment_reference_number || null,
      ]
    );

    const orderId = (orderResult as any).insertId;

    // Insert order items
    for (const orderItem of orderItems) {
      await conn.query(
        `INSERT INTO order_item
         (order_id, menu_item_id, custom_cake_request_id, item_name, item_description,
          quantity, unit_price, subtotal, customization_notes, special_requests)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderItem.menu_item_id,
          orderItem.custom_cake_request_id,
          orderItem.item_name,
          orderItem.item_description,
          orderItem.quantity,
          orderItem.unit_price,
          orderItem.subtotal,
          orderItem.customization_notes,
          orderItem.special_requests,
        ]
      );
    }

    return {
      order_id: orderId,
      order_number: orderNumber,
      verification_code: verificationCode,
      total_amount: totals.total,
      items_count: orderItems.length,
      estimated_preparation_minutes: estimatedPreparationMinutes,
    };
  });

  // Broadcast order created event to connected clients
  sseService.broadcast(SSEChannels.ORDERS, SSEEvents.ORDER_CREATED, {
    order_id: result.order_id,
    order_number: result.order_number,
    total_amount: result.total_amount,
    items_count: result.items_count,
    estimated_preparation_minutes: result.estimated_preparation_minutes,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(successResponse('Order created successfully', result));
};

// Get order by ID (for kiosk order confirmation page)
export const getOrderById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    throw new AppError('Invalid order ID', 400);
  }

  const orders = await query(
    `SELECT co.*, c.name, c.phone,
     COALESCE(a.name, ca.name) as cashier_name,
     COALESCE(a.username, ca.username) as cashier_username
     FROM customer_order co
     LEFT JOIN customer c ON co.customer_id = c.customer_id
     LEFT JOIN admin a ON co.cashier_id = a.admin_id
     LEFT JOIN cashier ca ON co.cashier_id = ca.cashier_id
     WHERE co.order_id = ?`,
    [orderId]
  );

  const order = Array.isArray(orders) && orders.length > 0 ? orders[0] : null;

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Get order items
  const items = await query(
    `SELECT oi.*, oi.subtotal as item_total, mi.name as menu_item_name, mi.preparation_time_minutes, mi.allergen_info, mi.nutritional_info
     FROM order_item oi
     LEFT JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  // Calculate total from items if final_amount is null or missing
  if (!order.final_amount && Array.isArray(items) && items.length > 0) {
    const itemsTotal = items.reduce((sum: number, item: any) => sum + (Number(item.subtotal) || 0), 0);
    order.subtotal = order.subtotal || itemsTotal;
    order.total_amount = order.total_amount || itemsTotal;
    order.final_amount = itemsTotal;
    order.tax_amount = order.tax_amount || 0;
    order.discount_amount = order.discount_amount || 0;
  }

  res.json(successResponse('Order retrieved', { ...order, items }));
};

// Get order by verification code (using order_id as fallback)
export const getOrderByVerificationCode = async (req: AuthRequest, res: Response) => {
  const { code } = req.params;

  // Try to find order by order_id (numeric) or kiosk_session_id
  let order = null;

  // If code is numeric, try order_id first
  if (!isNaN(Number(code))) {
    order = getFirstRow<any>(await query(
      `SELECT * FROM customer_order
       WHERE order_id = ?`,
      [code]
    ));
  }

  // If not found, try kiosk_session_id
  if (!order) {
    order = getFirstRow<any>(await query(
      `SELECT * FROM customer_order
       WHERE kiosk_session_id = ?
       AND DATE(order_datetime) = CURDATE()
       ORDER BY order_datetime DESC
       LIMIT 1`,
      [code]
    ));
  }

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Get order items
  const items = await query(
    `SELECT oi.*, oi.subtotal as item_total, mi.name as menu_item_name, mi.preparation_time_minutes, mi.allergen_info, mi.nutritional_info
     FROM order_item oi
     LEFT JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
     WHERE oi.order_id = ?`,
    [order.order_id]
  );

  res.json(successResponse('Order retrieved', { ...order, items }));
};

// Verify payment
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { order_id, reference_number, payment_method, amount_tendered, customer_discount_type_id } = req.body;
  const cashier_id = req.user?.id;

  // Handle cash and cashless payments
  await transaction(async (conn: PoolConnection) => {
    const [orderDataRows] = await conn.query(
      'SELECT subtotal, tax_amount, final_amount, payment_method FROM customer_order WHERE order_id = ? AND is_deleted = FALSE',
      [order_id]
    );
    const orderData = getFirstRow<any>(orderDataRows);

    if (!orderData) {
      throw new AppError('Order not found', 404);
    }

    let finalAmount = parseFloat(orderData.final_amount || 0);
    let discountAmount = 0;
    let discountPercentage = 0;

    // Apply discount if provided
    if (customer_discount_type_id) {
      const [discountRows] = await conn.query(
        'SELECT discount_percentage, name FROM customer_discount_type WHERE discount_type_id = ? AND is_active = TRUE',
        [customer_discount_type_id]
      );
      const discountData = getFirstRow<any>(discountRows);

      if (!discountData) {
        throw new AppError('Invalid or inactive discount type', 400);
      }

      discountPercentage = parseFloat(discountData.discount_percentage || 0);
      const subtotal = parseFloat(orderData.subtotal || 0);

      // Calculate discount amount based on subtotal
      discountAmount = (subtotal * discountPercentage) / 100;

      // Recalculate final amount: subtotal + tax - discount
      const taxAmount = parseFloat(orderData.tax_amount || 0);
      finalAmount = subtotal + taxAmount - discountAmount;

      // Update order with discount information
      await conn.query(
        `UPDATE customer_order
         SET customer_discount_type_id = ?,
             discount_amount = ?,
             final_amount = ?
         WHERE order_id = ?`,
        [customer_discount_type_id, discountAmount, finalAmount, order_id]
      );
    }

    let amountPaid = finalAmount;
    let changeAmount = 0;

    // For cash payments, calculate change
    if (payment_method === 'cash' && amount_tendered) {
      const tendered = parseFloat(amount_tendered);

      // Validate that amount tendered is sufficient
      if (tendered < finalAmount) {
        throw new AppError(
          `Insufficient amount. Need ₱${finalAmount.toFixed(2)}, received ₱${tendered.toFixed(2)}`,
          400
        );
      }

      amountPaid = tendered;
      changeAmount = tendered - finalAmount;
    }

    // ✅ STOCK DEDUCTION: Get order items and deduct stock quantities
    const [orderItemsRows] = await conn.query(
      'SELECT menu_item_id, quantity FROM order_item WHERE order_id = ?',
      [order_id]
    );
    const orderItems = orderItemsRows as any[];

    for (const item of orderItems) {
      // Get menu item details including stock info
      const [menuItemRows] = await conn.query(
        'SELECT is_infinite_stock, stock_quantity, name FROM menu_item WHERE menu_item_id = ?',
        [item.menu_item_id]
      );
      const menuItem = getFirstRow<any>(menuItemRows);

      if (!menuItem) {
        throw new AppError(`Menu item ${item.menu_item_id} not found`, 404);
      }

      // Skip stock deduction for infinite stock items
      if (menuItem.is_infinite_stock) {
        continue;
      }

      // Validate sufficient stock
      const currentStock = parseInt(menuItem.stock_quantity || 0);
      const requestedQty = parseInt(item.quantity || 0);

      if (currentStock < requestedQty) {
        throw new AppError(
          `Insufficient stock for ${menuItem.name}. Available: ${currentStock}, Required: ${requestedQty}`,
          400
        );
      }

      // Deduct stock quantity
      await conn.query(
        'UPDATE menu_item SET stock_quantity = stock_quantity - ? WHERE menu_item_id = ?',
        [requestedQty, item.menu_item_id]
      );

      // Auto-update status to 'sold_out' if stock reaches 0
      const newStock = currentStock - requestedQty;
      if (newStock === 0) {
        await conn.query(
          'UPDATE menu_item SET status = ? WHERE menu_item_id = ? AND status != ?',
          ['sold_out', item.menu_item_id, 'discontinued']
        );
        console.log(`📦 Auto-updated status to 'sold_out' for ${menuItem.name} (stock: 0)`);
      }
    }

    console.log('💰 Updating payment status to PAID:', {
      order_id,
      amount_paid: amountPaid,
      change_amount: changeAmount,
      cashier_id,
      payment_method
    });

    await conn.query(
      `UPDATE customer_order
       SET payment_status = 'paid',
           amount_paid = ?,
           change_amount = ?,
           payment_verified_by = ?,
           payment_verified_at = NOW()
       WHERE order_id = ?`,
      [amountPaid, changeAmount, cashier_id, order_id]
    );

    console.log('✓ Payment status updated successfully');

    await conn.query(
      `INSERT INTO payment_transaction
       (order_id, transaction_type, payment_method, amount, reference_number, status, processed_by, completed_at)
       VALUES (?, 'payment', ?, ?, ?, 'completed', ?, NOW())`,
      [order_id, payment_method, amountPaid, reference_number || null, cashier_id]
    );

    console.log('✓ Payment transaction recorded');

    // Verify the update actually worked
    const [verifyRows] = await conn.query(
      'SELECT payment_status, amount_paid FROM customer_order WHERE order_id = ?',
      [order_id]
    );
    const verifyUpdate = getFirstRow<any>(verifyRows);
    console.log('✅ Payment verification complete:', verifyUpdate);
  });

  res.json(successResponse('Payment verified successfully'));
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

  const order = getFirstRow<any>(await query(
    `SELECT co.*, c.name, c.phone
     FROM customer_order co
     LEFT JOIN customer c ON co.customer_id = c.customer_id
     WHERE co.order_id = ? AND co.is_deleted = FALSE`,
    [id]
  ));

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const items = await query(
    `SELECT oi.*,
            oi.subtotal as item_total,
            mi.name as menu_item_name,
            mi.name as item_name,
            mi.allergen_info,
            mi.nutritional_info,
            mi.preparation_time_minutes,
            mi.image_url,
            oi.unit_price,
            oi.quantity,
            oi.customization_notes,
            oi.special_requests
     FROM order_item oi
     JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
     WHERE oi.order_id = ?`,
    [id]
  );

  // Calculate total from items if final_amount is null or missing
  if (!order.final_amount && Array.isArray(items) && items.length > 0) {
    const itemsTotal = items.reduce((sum: number, item: any) => sum + (Number(item.subtotal) || 0), 0);
    order.subtotal = order.subtotal || itemsTotal;
    order.total_amount = order.total_amount || itemsTotal;
    order.final_amount = itemsTotal;
    order.tax_amount = order.tax_amount || 0;
    order.discount_amount = order.discount_amount || 0;
  }

  res.json(successResponse('Order details retrieved', { ...order, items }));
};

// Mark order as printed
export const markOrderPrinted = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user_id = req.user?.id;

  if (!user_id) {
    throw new AppError('User authentication required', 401);
  }

  // Check if order exists
  const order = getFirstRow<any>(await query(
    'SELECT order_id, is_printed FROM customer_order WHERE order_id = ? AND is_deleted = FALSE',
    [id]
  ));

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update is_printed flag
  await query(
    'UPDATE customer_order SET is_printed = TRUE, updated_at = NOW() WHERE order_id = ?',
    [id]
  );

  res.json(successResponse('Order marked as printed', { order_id: id, is_printed: true }));
};

// Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { order_status, notes } = req.body;
  const user_id = req.user?.id;
  const user_type = req.user?.type; // 'admin' or 'cashier'

  console.log('📝 updateOrderStatus called:', { id, order_status, user_id, user_type, notes });

  if (!order_status) {
    throw new AppError('Order status is required', 400);
  }

  if (!user_id) {
    throw new AppError('User authentication required', 401);
  }

  await transaction(async (conn: PoolConnection) => {
    // Check if order exists and get payment status
    const [orderRows] = await conn.query(
      'SELECT order_id, order_status, payment_status FROM customer_order WHERE order_id = ? AND is_deleted = FALSE',
      [id]
    );

    const existingOrder = getFirstRow<any>(orderRows);

    if (!existingOrder) {
      throw new AppError('Order not found', 404);
    }

    console.log('✓ Order found:', existingOrder);
    console.log('📊 Payment status check:', {
      requested_status: order_status,
      current_status: existingOrder.order_status,
      payment_status: existingOrder.payment_status,
      payment_status_type: typeof existingOrder.payment_status,
      is_paid: existingOrder.payment_status === 'paid'
    });

    // ⚠️ REQUIRE PAYMENT VERIFICATION BEFORE COMPLETION
    if (order_status === 'completed' && existingOrder.payment_status !== 'paid') {
      console.error('❌ Payment verification failed:', {
        order_id: id,
        current_payment_status: existingOrder.payment_status,
        required: 'paid'
      });
      throw new AppError(
        `Payment must be verified before completing order. Current payment status: "${existingOrder.payment_status}" (expected: "paid")`,
        400
      );
    }

    // Auto-set payment_status to 'paid' when changing to 'confirmed'
    // This ensures proper workflow: confirmed orders should have payment verified
    let paymentStatusUpdate = '';
    if (order_status === 'confirmed' && existingOrder.payment_status !== 'paid') {
      console.log('📝 Auto-setting payment_status to paid (confirming order)');
      paymentStatusUpdate = ", payment_status = 'paid', payment_verified_by = ?, payment_verified_at = NOW()";
    }

    // Update order status (only update cashier_id if user is a cashier)
    if (user_type === 'cashier') {
      console.log('📝 Updating as cashier, setting cashier_id:', user_id);
      if (paymentStatusUpdate) {
        await conn.query(
          `UPDATE customer_order SET order_status = ?, cashier_id = ?${paymentStatusUpdate}, updated_at = NOW() WHERE order_id = ?`,
          [order_status, user_id, user_id, id]
        );
      } else {
        await conn.query(
          'UPDATE customer_order SET order_status = ?, cashier_id = ?, updated_at = NOW() WHERE order_id = ?',
          [order_status, user_id, id]
        );
      }
    } else {
      console.log('📝 Updating as admin');
      if (paymentStatusUpdate) {
        await conn.query(
          `UPDATE customer_order SET order_status = ?${paymentStatusUpdate}, updated_at = NOW() WHERE order_id = ?`,
          [order_status, user_id, id]
        );
      } else {
        await conn.query(
          'UPDATE customer_order SET order_status = ?, updated_at = NOW() WHERE order_id = ?',
          [order_status, id]
        );
      }
    }

    console.log('✓ Order status updated successfully');

    // Add timeline entry
    await conn.query(
      `INSERT INTO order_timeline (order_id, status, changed_by, notes, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, order_status, user_id, notes || null]
    );

    console.log('✓ Timeline entry added successfully');
  });

  // Broadcast order status change event
  sseService.broadcast(SSEChannels.ORDERS, SSEEvents.ORDER_STATUS_CHANGED, {
    order_id: parseInt(id, 10),
    order_status,
    updated_by: user_id,
    timestamp: new Date().toISOString(),
  });

  res.json(successResponse('Order status updated', { order_status }));
  console.log('✓ Response sent successfully');
};

// Delete order (soft delete)
export const deleteOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  const user_type = req.user?.type;

  if (!user_id) {
    throw new AppError('User authentication required', 401);
  }

  // Check if order exists
  const existingOrder = await query(
    'SELECT order_id, order_status FROM customer_order WHERE order_id = ? AND is_deleted = FALSE',
    [id]
  );

  if (!Array.isArray(existingOrder) || existingOrder.length === 0) {
    throw new AppError('Order not found', 404);
  }

  // Soft delete the order
  await query(
    'UPDATE customer_order SET is_deleted = TRUE, updated_at = NOW() WHERE order_id = ?',
    [id]
  );

  // Add timeline entry
  await query(
    `INSERT INTO order_timeline (order_id, status, changed_by, notes, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [id, 'cancelled', user_id, `Order deleted by ${user_type}`]
  );

  res.json(successResponse('Order deleted successfully'));
};

// Get orders list with filters
export const getOrders = async (req: AuthRequest, res: Response) => {
  const {
    status,
    payment_status,
    order_type,
    date_from,
    date_to,
    page = '1',
    limit = '20',
  } = req.query;

  // Parse and validate pagination parameters
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT co.*, c.name, c.phone
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
    sql += ` AND DATE(co.created_at) >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    sql += ` AND DATE(co.created_at) <= ?`;
    params.push(date_to);
  }

  // Get total count
  const countSql = sql.replace(/SELECT co\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = getFirstRow<any>(await query(countSql, params));
  const total = countResult?.total || 0;

  sql += ` ORDER BY co.created_at DESC`;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(limitNum, offset);

  const orders = await query(sql, params);

  res.json(successResponse('Orders retrieved', {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  }));
};

// Mark QR code as scanned (called when customer views order-confirmation page)
export const markQRScanned = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    throw new AppError('Invalid order ID', 400);
  }

  // Verify order exists
  const order = await query(
    'SELECT order_id FROM customer_order WHERE order_id = ?',
    [orderId]
  );

  if (!Array.isArray(order) || order.length === 0) {
    throw new AppError('Order not found', 404);
  }

  // Mark as scanned in memory
  scannedQRCodes.add(orderId);

  console.log(`✅ QR code scanned for order ${orderId}`);

  res.json(successResponse('QR code marked as scanned', { order_id: orderId, scanned: true }));
};

// Check if QR code has been scanned
export const checkQRStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    throw new AppError('Invalid order ID', 400);
  }

  const isScanned = scannedQRCodes.has(orderId);

  res.json(successResponse('QR status retrieved', { order_id: orderId, qr_scanned: isScanned }));
};
