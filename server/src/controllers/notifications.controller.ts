import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { successResponse, errorResponse } from '../utils/helpers';

export interface Notification {
  notification_id: string; // Composite: type-id
  type: 'custom_cake_message' | 'low_stock' | 'new_order' | 'stock_update' | 'custom_cake_status';
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  entity_id: number; // ID of the related entity (request_id, order_id, item_id)
  entity_type: string; // 'custom_cake_request', 'order', 'menu_item'
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: any;
}

/**
 * Get all notifications for admin/cashier
 * @route GET /api/notifications
 */
export const getAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0, unread_only = false } = req.query;
    const notifications: Notification[] = [];

    // 1. Custom Cake Messages (unread)
    const [cakeMessages] = await pool.query<RowDataPacket[]>(
      `SELECT
        n.notification_id,
        n.request_id,
        n.sender_name,
        n.message_body,
        n.sent_at,
        n.is_read,
        ccr.customer_name,
        ccr.status as request_status
      FROM custom_cake_notifications n
      INNER JOIN custom_cake_request ccr ON n.request_id = ccr.request_id
      WHERE n.sender_type = 'customer'
      ${unread_only === 'true' ? 'AND n.is_read = FALSE' : ''}
      ORDER BY n.sent_at DESC
      LIMIT ?`,
      [parseInt(limit as string)]
    );

    cakeMessages.forEach((msg: any) => {
      notifications.push({
        notification_id: `custom_cake_message-${msg.notification_id}`,
        type: 'custom_cake_message',
        title: `Message from ${msg.customer_name}`,
        message: msg.message_body.substring(0, 100) + (msg.message_body.length > 100 ? '...' : ''),
        is_read: msg.is_read,
        created_at: msg.sent_at,
        entity_id: msg.request_id,
        entity_type: 'custom_cake_request',
        priority: 'high',
        action_url: `/admin/custom-cakes?request=${msg.request_id}`,
        metadata: {
          customer_name: msg.customer_name,
          request_status: msg.request_status,
        },
      });
    });

    // 2. Custom Cake Status Changes (new submissions, approvals)
    const [cakeStatusChanges] = await pool.query<RowDataPacket[]>(
      `SELECT
        request_id,
        customer_name,
        status,
        submitted_at,
        updated_at
      FROM custom_cake_request
      WHERE status = 'pending_review'
      OR (status IN ('approved', 'rejected') AND updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR))
      ORDER BY updated_at DESC
      LIMIT ?`,
      [parseInt(limit as string)]
    );

    cakeStatusChanges.forEach((req: any) => {
      if (req.status === 'pending_review') {
        notifications.push({
          notification_id: `custom_cake_status-${req.request_id}`,
          type: 'custom_cake_status',
          title: `New Custom Cake Request`,
          message: `${req.customer_name} submitted a new custom cake request`,
          is_read: false, // Always show new requests as unread
          created_at: req.submitted_at,
          entity_id: req.request_id,
          entity_type: 'custom_cake_request',
          priority: 'high',
          action_url: `/admin/custom-cakes?request=${req.request_id}`,
          metadata: {
            customer_name: req.customer_name,
            status: req.status,
          },
        });
      }
    });

    // 3. Low Stock Items
    const [lowStockItems] = await pool.query<RowDataPacket[]>(
      `SELECT
        menu_item_id,
        name,
        stock_quantity,
        min_stock_level,
        status,
        updated_at
      FROM menu_item
      WHERE status = 'available'
      AND is_infinite_stock = FALSE
      AND stock_quantity <= min_stock_level
      AND stock_quantity > 0
      ORDER BY (stock_quantity / NULLIF(min_stock_level, 0)) ASC
      LIMIT ?`,
      [parseInt(limit as string)]
    );

    lowStockItems.forEach((item: any) => {
      notifications.push({
        notification_id: `low_stock-${item.menu_item_id}`,
        type: 'low_stock',
        title: `Low Stock Alert`,
        message: `${item.name} is running low (${item.stock_quantity} remaining)`,
        is_read: false,
        created_at: item.updated_at,
        entity_id: item.menu_item_id,
        entity_type: 'menu_item',
        priority: item.stock_quantity === 0 ? 'high' : item.stock_quantity <= (item.min_stock_level / 2) ? 'medium' : 'low',
        action_url: `/admin/menu?item=${item.menu_item_id}`,
        metadata: {
          item_name: item.name,
          current_stock: item.stock_quantity,
          min_stock: item.min_stock_level,
        },
      });
    });

    // 4. Recent Orders (last 24 hours)
    const [recentOrders] = await pool.query<RowDataPacket[]>(
      `SELECT
        order_id,
        order_number,
        order_type,
        order_status,
        total_amount,
        created_at
      FROM customer_order
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND order_status IN ('pending', 'confirmed')
      ORDER BY created_at DESC
      LIMIT ?`,
      [parseInt(limit as string)]
    );

    recentOrders.forEach((order: any) => {
      notifications.push({
        notification_id: `new_order-${order.order_id}`,
        type: 'new_order',
        title: `New Order #${order.order_number}`,
        message: `${order.order_type} order for ₱${order.total_amount} - ${order.order_status}`,
        is_read: false,
        created_at: order.created_at,
        entity_id: order.order_id,
        entity_type: 'order',
        priority: order.order_status === 'pending' ? 'high' : 'medium',
        action_url: `/cashier/orders?order=${order.order_id}`,
        metadata: {
          order_number: order.order_number,
          order_type: order.order_type,
          order_status: order.order_status,
          total_amount: order.total_amount,
        },
      });
    });

    // Sort all notifications by date (newest first)
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply offset and limit
    const paginatedNotifications = notifications.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    // Count unread
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json(successResponse('Notifications retrieved successfully', {
      notifications: paginatedNotifications,
      total: notifications.length,
      unread_count: unreadCount,
      has_more: notifications.length > parseInt(offset as string) + parseInt(limit as string),
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json(errorResponse('Failed to fetch notifications'));
  }
};

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    let totalUnread = 0;

    // Custom cake messages
    const [cakeMessages] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
      FROM custom_cake_notifications
      WHERE sender_type = 'customer'
      AND is_read = FALSE`
    );
    totalUnread += cakeMessages[0]?.count || 0;

    // Pending custom cake requests
    const [pendingRequests] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
      FROM custom_cake_request
      WHERE status = 'pending_review'`
    );
    totalUnread += pendingRequests[0]?.count || 0;

    // Low stock items
    const [lowStock] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
      FROM menu_item
      WHERE status = 'available'
      AND is_infinite_stock = FALSE
      AND stock_quantity <= min_stock_level`
    );
    totalUnread += lowStock[0]?.count || 0;

    // Pending orders (last 24 hours)
    const [pendingOrders] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
      FROM customer_order
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND order_status = 'pending'`
    );
    totalUnread += pendingOrders[0]?.count || 0;

    res.json(successResponse('Unread count retrieved', {
      unread_count: totalUnread,
      breakdown: {
        custom_cake_messages: cakeMessages[0]?.count || 0,
        pending_requests: pendingRequests[0]?.count || 0,
        low_stock: lowStock[0]?.count || 0,
        pending_orders: pendingOrders[0]?.count || 0,
      },
    }));
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json(errorResponse('Failed to get unread count'));
  }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Parse composite ID (type-entityId)
    const [type, entityId] = id.split('-');

    if (type === 'custom_cake_message') {
      await pool.query(
        `UPDATE custom_cake_notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE notification_id = ?`,
        [entityId]
      );
    }
    // Other types don't have read status in DB, just acknowledge on client

    res.json(successResponse('Notification marked as read'));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json(errorResponse('Failed to mark notification as read'));
  }
};
