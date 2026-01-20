import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { successResponse, errorResponse } from '../utils/helpers';
import { sseService, SSEChannels, SSEEvents } from '../services/sse.service';
import { emailService } from '../services/email.service';

interface Message extends RowDataPacket {
  notification_id: number;
  request_id: number;
  notification_type: string;
  sender_type: 'customer' | 'admin' | 'system';
  sender_name: string;
  recipient_email: string;
  subject: string;
  message_body: string;
  status: 'pending' | 'sent' | 'failed';
  is_read: boolean;
  sent_at: Date;
  read_at: Date | null;
  parent_notification_id: number | null;
  customer_name: string;
  customer_email: string;
  request_status: string;
}

/**
 * Get all messages for a specific custom cake request
 * @route GET /api/admin/custom-cakes/:requestId/messages
 */
export const getMessagesByRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;

    // Verify request exists
    const [requests] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM custom_cake_request WHERE request_id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json(errorResponse('Custom cake request not found'));
    }

    // Get all messages for this request
    const [messages] = await pool.query<Message[]>(
      `SELECT
        n.notification_id,
        n.request_id,
        n.notification_type,
        n.sender_type,
        n.sender_name,
        n.recipient_email,
        n.subject,
        n.message_body,
        n.status,
        n.is_read,
        n.sent_at,
        n.read_at,
        n.parent_notification_id,
        ccr.customer_name,
        ccr.customer_email,
        ccr.status as request_status
      FROM custom_cake_notifications n
      INNER JOIN custom_cake_request ccr ON n.request_id = ccr.request_id
      WHERE n.request_id = ?
      ORDER BY n.sent_at ASC`,
      [requestId]
    );

    res.json(successResponse('Messages retrieved successfully', {
      messages,
      request: requests[0],
      unread_count: messages.filter(m => !m.is_read && m.sender_type === 'customer').length
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json(errorResponse('Failed to fetch messages'));
  }
};

/**
 * Send a message (admin reply to customer)
 * @route POST /api/admin/custom-cakes/:requestId/messages
 */
export const sendAdminMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { message_body, subject, parent_notification_id } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.username || 'Admin';

    if (!message_body || !message_body.trim()) {
      return res.status(400).json(errorResponse('Message body is required'));
    }

    // Get request details
    const [requests] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM custom_cake_request WHERE request_id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json(errorResponse('Custom cake request not found'));
    }

    const request = requests[0];
    // Always include request ID in subject for email reply tracking
    const messageSubject = subject || `Custom Cake Request #${requestId} - Message from GoldenMunch`;

    // Insert message into database
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO custom_cake_notifications
      (request_id, notification_type, sender_type, sender_name, recipient_email, subject, message_body, status, parent_notification_id)
      VALUES (?, 'message', 'admin', ?, ?, ?, ?, 'sent', ?)`,
      [requestId, userName, request.customer_email, messageSubject, message_body, parent_notification_id || null]
    );

    const notificationId = result.insertId;

    // Get the newly created message
    const [newMessage] = await pool.query<Message[]>(
      `SELECT
        n.notification_id,
        n.request_id,
        n.notification_type,
        n.sender_type,
        n.sender_name,
        n.recipient_email,
        n.subject,
        n.message_body,
        n.status,
        n.is_read,
        n.sent_at,
        n.read_at,
        n.parent_notification_id,
        ccr.customer_name,
        ccr.customer_email,
        ccr.status as request_status
      FROM custom_cake_notifications n
      INNER JOIN custom_cake_request ccr ON n.request_id = ccr.request_id
      WHERE n.notification_id = ?`,
      [notificationId]
    );

    // Broadcast SSE event for real-time updates
    sseService.broadcast(SSEChannels.CUSTOM_CAKES, SSEEvents.CUSTOM_CAKE_MESSAGE_RECEIVED, {
      request_id: parseInt(requestId, 10),
      message: newMessage[0],
      timestamp: new Date().toISOString(),
    });

    // Send email notification to customer with beautiful template
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💬 New Message from GoldenMunch</h1>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px;">Dear ${request.customer_name},</p>

          <p style="font-size: 16px;">You have received a new message regarding your custom cake request <strong>#${requestId}</strong>:</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35;">
            ${message_body}
          </div>

          <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #3B82F6;">
            <p style="margin: 0; color: #1E3A8A; font-size: 14px;"><strong>💬 You can reply to this email!</strong></p>
            <p style="margin: 10px 0 0 0; color: #1E3A8A; font-size: 14px;">Simply hit "Reply" and your message will be sent directly to our team. We'll see it in the admin panel and respond quickly.</p>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 10px 0;">Best regards,<br><strong>The GoldenMunch Team</strong></p>
          <p style="margin: 0;">📧 ${process.env.EMAIL_FROM_ADDRESS || 'goldenmunch@example.com'}</p>
          <p style="margin: 5px 0 0 0;">📞 ${process.env.BUSINESS_PHONE || 'Contact us'}</p>
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: request.customer_email,
      subject: messageSubject,
      html: emailTemplate,
    }).catch((error) => {
      console.error('Failed to send message email notification:', error);
    });

    res.status(201).json(successResponse('Message sent successfully', newMessage[0]));
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json(errorResponse('Failed to send message'));
  }
};

/**
 * Mark messages as read
 * @route PUT /api/admin/custom-cakes/:requestId/messages/mark-read
 */
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { notification_ids } = req.body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return res.status(400).json(errorResponse('notification_ids array is required'));
    }

    if (notification_ids.length === 0) {
      return res.json(successResponse('No messages to mark as read', { updated: 0 }));
    }

    // Mark messages as read
    const placeholders = notification_ids.map(() => '?').join(',');
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE custom_cake_notifications
      SET is_read = TRUE, read_at = NOW()
      WHERE notification_id IN (${placeholders})
      AND request_id = ?
      AND is_read = FALSE`,
      [...notification_ids, requestId]
    );

    // Broadcast SSE event
    sseService.broadcast(SSEChannels.CUSTOM_CAKES, SSEEvents.CUSTOM_CAKE_MESSAGES_READ, {
      request_id: parseInt(requestId, 10),
      notification_ids,
      timestamp: new Date().toISOString(),
    });

    res.json(successResponse('Messages marked as read', { updated: result.affectedRows }));
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json(errorResponse('Failed to mark messages as read'));
  }
};

/**
 * Get unread message count across all custom cake requests
 * @route GET /api/admin/custom-cakes/messages/unread-count
 */
export const getUnreadMessageCount = async (req: AuthRequest, res: Response) => {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as unread_count
      FROM custom_cake_notifications
      WHERE sender_type = 'customer'
      AND is_read = FALSE
      AND status = 'sent'`
    );

    const unreadCount = result[0]?.unread_count || 0;

    res.json(successResponse('Unread count retrieved', { unread_count: unreadCount }));
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json(errorResponse('Failed to get unread count'));
  }
};

/**
 * Customer: Get messages for their custom cake request
 * @route GET /api/custom-cake/messages/:requestId
 */
export const getCustomerMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { verification_code } = req.query;

    // Verify request exists and verification code matches
    const [requests] = await pool.query<RowDataPacket[]>(
      `SELECT ccr.*, co.verification_code
      FROM custom_cake_request ccr
      LEFT JOIN customer_order co ON ccr.order_id = co.order_id
      WHERE ccr.request_id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json(errorResponse('Custom cake request not found'));
    }

    const request = requests[0];

    // Verify verification code if provided
    if (verification_code && request.verification_code !== verification_code) {
      return res.status(403).json(errorResponse('Invalid verification code'));
    }

    // Get messages
    const [messages] = await pool.query<Message[]>(
      `SELECT
        notification_id,
        request_id,
        notification_type,
        sender_type,
        sender_name,
        subject,
        message_body,
        status,
        is_read,
        sent_at,
        read_at,
        parent_notification_id
      FROM custom_cake_notifications
      WHERE request_id = ?
      ORDER BY sent_at ASC`,
      [requestId]
    );

    res.json(successResponse('Messages retrieved successfully', {
      messages,
      request_status: request.status
    }));
  } catch (error) {
    console.error('Error fetching customer messages:', error);
    res.status(500).json(errorResponse('Failed to fetch messages'));
  }
};

/**
 * Customer: Send a reply message
 * @route POST /api/custom-cake/messages/:requestId/reply
 */
export const sendCustomerReply = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { message_body, verification_code, parent_notification_id } = req.body;

    if (!message_body || !message_body.trim()) {
      return res.status(400).json(errorResponse('Message body is required'));
    }

    // Verify request and verification code
    const [requests] = await pool.query<RowDataPacket[]>(
      `SELECT ccr.*, co.verification_code
      FROM custom_cake_request ccr
      LEFT JOIN customer_order co ON ccr.order_id = co.order_id
      WHERE ccr.request_id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json(errorResponse('Custom cake request not found'));
    }

    const request = requests[0];

    if (verification_code && request.verification_code !== verification_code) {
      return res.status(403).json(errorResponse('Invalid verification code'));
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const subject = `Customer Reply: Custom Cake Request #${requestId}`;

    // Insert customer message
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO custom_cake_notifications
      (request_id, notification_type, sender_type, sender_name, recipient_email, subject, message_body, status, parent_notification_id)
      VALUES (?, 'message', 'customer', ?, ?, ?, ?, 'sent', ?)`,
      [requestId, request.customer_name, adminEmail, subject, message_body, parent_notification_id || null]
    );

    const notificationId = result.insertId;

    // Get the newly created message
    const [newMessage] = await pool.query<Message[]>(
      `SELECT
        notification_id,
        request_id,
        notification_type,
        sender_type,
        sender_name,
        subject,
        message_body,
        status,
        is_read,
        sent_at,
        read_at,
        parent_notification_id
      FROM custom_cake_notifications
      WHERE notification_id = ?`,
      [notificationId]
    );

    // Broadcast SSE event
    sseService.broadcast(SSEChannels.CUSTOM_CAKES, SSEEvents.CUSTOM_CAKE_MESSAGE_RECEIVED, {
      request_id: parseInt(requestId, 10),
      message: newMessage[0],
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(successResponse('Reply sent successfully', newMessage[0]));
  } catch (error) {
    console.error('Error sending customer reply:', error);
    res.status(500).json(errorResponse('Failed to send reply'));
  }
};
