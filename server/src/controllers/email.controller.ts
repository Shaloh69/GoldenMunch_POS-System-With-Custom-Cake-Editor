import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { successResponse, errorResponse } from '../utils/helpers';
import { emailService } from '../services/email.service';

interface EmailRecord extends RowDataPacket {
  notification_id: number;
  request_id: number;
  notification_type: string;
  sender_type: string;
  sender_name: string;
  recipient_email: string;
  subject: string;
  message_body: string;
  sent_at: Date;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  customer_name?: string;
}

/**
 * Get all email history with pagination and filtering
 */
export const getAllEmails = async (req: AuthRequest, res: Response) => {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      notification_type,
      request_id,
      search
    } = req.query;

    let query = `
      SELECT
        ccn.*,
        ccr.customer_name,
        ccr.customer_email as request_email
      FROM custom_cake_notifications ccn
      LEFT JOIN custom_cake_request ccr ON ccn.request_id = ccr.request_id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Apply filters
    if (status) {
      query += ` AND ccn.status = ?`;
      params.push(status);
    }

    if (notification_type) {
      query += ` AND ccn.notification_type = ?`;
      params.push(notification_type);
    }

    if (request_id) {
      query += ` AND ccn.request_id = ?`;
      params.push(request_id);
    }

    if (search) {
      query += ` AND (ccn.recipient_email LIKE ? OR ccn.subject LIKE ? OR ccr.customer_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('ccn.*,\n        ccr.customer_name,\n        ccr.customer_email as request_email', 'COUNT(*) as total');
    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Add pagination and sorting
    query += ` ORDER BY ccn.sent_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [emails] = await pool.query<EmailRecord[]>(query, params);

    res.json(successResponse('Email history retrieved successfully', {
      emails,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      has_more: total > parseInt(offset as string) + parseInt(limit as string),
    }));
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json(errorResponse('Failed to fetch email history'));
  }
};

/**
 * Get email statistics
 */
export const getEmailStats = async (req: AuthRequest, res: Response) => {
  try {
    const [stats] = await pool.query<RowDataPacket[]>(`
      SELECT
        COUNT(*) as total_emails,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN notification_type = 'submission_received' THEN 1 ELSE 0 END) as submission_emails,
        SUM(CASE WHEN notification_type = 'approved' THEN 1 ELSE 0 END) as approved_emails,
        SUM(CASE WHEN notification_type = 'rejected' THEN 1 ELSE 0 END) as rejected_emails,
        SUM(CASE WHEN notification_type = 'ready_for_pickup' THEN 1 ELSE 0 END) as pickup_emails,
        SUM(CASE WHEN notification_type = 'reminder' THEN 1 ELSE 0 END) as reminder_emails
      FROM custom_cake_notifications
    `);

    res.json(successResponse('Email statistics retrieved successfully', stats[0]));
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json(errorResponse('Failed to fetch email statistics'));
  }
};

/**
 * Get single email details
 */
export const getEmailById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [emails] = await pool.query<EmailRecord[]>(
      `SELECT
        ccn.*,
        ccr.customer_name,
        ccr.customer_email as request_email,
        ccr.customer_phone,
        ccr.status as request_status
      FROM custom_cake_notifications ccn
      LEFT JOIN custom_cake_request ccr ON ccn.request_id = ccr.request_id
      WHERE ccn.notification_id = ?`,
      [id]
    );

    if (emails.length === 0) {
      return res.status(404).json(errorResponse('Email not found'));
    }

    res.json(successResponse('Email details retrieved successfully', emails[0]));
  } catch (error) {
    console.error('Error fetching email details:', error);
    res.status(500).json(errorResponse('Failed to fetch email details'));
  }
};

/**
 * Send custom email to customer
 */
export const sendCustomEmail = async (req: AuthRequest, res: Response) => {
  try {
    const {
      request_id,
      recipient_email,
      subject,
      message_body,
      notification_type = 'admin_message'
    } = req.body;

    // Validation
    if (!recipient_email || !subject || !message_body) {
      return res.status(400).json(errorResponse('Missing required fields: recipient_email, subject, message_body'));
    }

    // Admin name for sender
    const adminName = 'Admin';

    // Insert email record
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO custom_cake_notifications
      (request_id, notification_type, sender_type, sender_name, recipient_email, subject, message_body, status)
      VALUES (?, ?, 'admin', ?, ?, ?, ?, 'pending')`,
      [request_id || null, notification_type, adminName, recipient_email, subject, message_body]
    );

    const notificationId = result.insertId;

    // Send email immediately
    const success = await emailService.sendEmail({
      to: recipient_email,
      subject,
      html: message_body,
    });

    if (success) {
      // Update status to sent
      await pool.query(
        `UPDATE custom_cake_notifications SET status = 'sent', sent_at = NOW() WHERE notification_id = ?`,
        [notificationId]
      );

      res.json(successResponse('Email sent successfully', {
        notification_id: notificationId,
        status: 'sent'
      }));
    } else {
      // Mark as failed
      await pool.query(
        `UPDATE custom_cake_notifications SET status = 'failed', error_message = 'Failed to send email' WHERE notification_id = ?`,
        [notificationId]
      );

      res.status(500).json(errorResponse('Failed to send email. Please check email configuration.'));
    }
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json(errorResponse('Failed to send custom email'));
  }
};

/**
 * Retry failed email
 */
export const retryEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get email record
    const [emails] = await pool.query<EmailRecord[]>(
      `SELECT * FROM custom_cake_notifications WHERE notification_id = ?`,
      [id]
    );

    if (emails.length === 0) {
      return res.status(404).json(errorResponse('Email not found'));
    }

    const email = emails[0];

    // Reset status to pending
    await pool.query(
      `UPDATE custom_cake_notifications SET status = 'pending', error_message = NULL WHERE notification_id = ?`,
      [id]
    );

    // Attempt to send
    const success = await emailService.sendEmail({
      to: email.recipient_email,
      subject: email.subject,
      html: email.message_body,
    });

    if (success) {
      await pool.query(
        `UPDATE custom_cake_notifications SET status = 'sent', sent_at = NOW() WHERE notification_id = ?`,
        [id]
      );

      res.json(successResponse('Email sent successfully', { status: 'sent' }));
    } else {
      await pool.query(
        `UPDATE custom_cake_notifications SET status = 'failed', error_message = 'Failed to send email' WHERE notification_id = ?`,
        [id]
      );

      res.status(500).json(errorResponse('Failed to send email. Please check email configuration.'));
    }
  } catch (error) {
    console.error('Error retrying email:', error);
    res.status(500).json(errorResponse('Failed to retry email'));
  }
};

/**
 * Delete email record
 */
export const deleteEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM custom_cake_notifications WHERE notification_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('Email not found'));
    }

    res.json(successResponse('Email deleted successfully'));
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json(errorResponse('Failed to delete email'));
  }
};
