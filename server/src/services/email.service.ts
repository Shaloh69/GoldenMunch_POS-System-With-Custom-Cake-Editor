import nodemailer, { Transporter } from 'nodemailer';
import * as dotenv from 'dotenv';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationRecord {
  notification_id: number;
  request_id: number;
  notification_type: string;
  recipient_email: string;
  subject: string;
  message_body: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    // Check if email is properly configured
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email service not configured. Email not sent to:', options.to);
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'GoldenMunch POS'}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Process all pending notifications in the database
   */
  async processPendingNotifications(): Promise<void> {
    if (!this.isConfigured) {
      console.log('Email service not configured. Skipping pending notifications.');
      return;
    }

    try {
      // Get all pending notifications
      const [notifications] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_notifications
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT 50`
      );

      if (notifications.length === 0) {
        return;
      }

      console.log(`📧 Processing ${notifications.length} pending notifications...`);

      for (const notification of notifications) {
        await this.sendNotification(notification as NotificationRecord);
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Send a single notification from database record
   */
  async sendNotification(notification: NotificationRecord): Promise<void> {
    try {
      const success = await this.sendEmail({
        to: notification.recipient_email,
        subject: notification.subject,
        html: notification.message_body,
        text: this.stripHtml(notification.message_body),
      });

      if (success) {
        // Update notification status to sent
        await pool.query(
          `UPDATE custom_cake_notifications
           SET status = 'sent', sent_at = NOW()
           WHERE notification_id = ?`,
          [notification.notification_id]
        );
      } else {
        // Mark as failed
        await pool.query(
          `UPDATE custom_cake_notifications
           SET status = 'failed', error_message = 'Failed to send email'
           WHERE notification_id = ?`,
          [notification.notification_id]
        );
      }
    } catch (error) {
      console.error(`Failed to send notification ${notification.notification_id}:`, error);
      await pool.query(
        `UPDATE custom_cake_notifications
         SET status = 'failed', error_message = ?
         WHERE notification_id = ?`,
        [error instanceof Error ? error.message : 'Unknown error', notification.notification_id]
      );
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      const [notifications] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_notifications
         WHERE status = 'failed'
         AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOURS)
         ORDER BY created_at ASC
         LIMIT 20`
      );

      console.log(`🔄 Retrying ${notifications.length} failed notifications...`);

      for (const notification of notifications) {
        // Reset status to pending before retrying
        await pool.query(
          `UPDATE custom_cake_notifications
           SET status = 'pending', error_message = NULL
           WHERE notification_id = ?`,
          [notification.notification_id]
        );

        await this.sendNotification(notification as NotificationRecord);
      }
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
    }
  }

  /**
   * Strip HTML tags for plain text email
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Send pickup reminder notifications
   */
  async sendPickupReminders(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      // Get all approved custom cakes with pickup scheduled for tomorrow
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT
          ccr.request_id,
          ccr.customer_name,
          ccr.customer_email,
          ccr.customer_phone,
          ccr.scheduled_pickup_date,
          ccr.scheduled_pickup_time,
          ccr.approved_price,
          co.order_number,
          co.verification_code
         FROM custom_cake_request ccr
         LEFT JOIN customer_order co ON ccr.order_id = co.order_id
         WHERE ccr.status IN ('approved', 'completed')
         AND ccr.scheduled_pickup_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND NOT EXISTS (
           SELECT 1 FROM custom_cake_notifications
           WHERE request_id = ccr.request_id
           AND notification_type = 'reminder'
           AND DATE(created_at) = CURDATE()
         )`
      );

      console.log(`📅 Sending ${requests.length} pickup reminders for tomorrow...`);

      for (const request of requests) {
        await this.createPickupReminder(request);
      }
    } catch (error) {
      console.error('Error sending pickup reminders:', error);
    }
  }

  /**
   * Create pickup reminder notification
   */
  async createPickupReminder(request: any): Promise<void> {
    const pickupDate = new Date(request.scheduled_pickup_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pickupTime = request.scheduled_pickup_time || 'during business hours';

    const subject = '🎂 Reminder: Your Custom Cake is Ready for Pickup Tomorrow!';
    const messageBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">🎂 Pickup Reminder</h2>

        <p>Dear ${request.customer_name},</p>

        <p>This is a friendly reminder that your custom cake is ready for pickup <strong>tomorrow</strong>!</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #FF6B35;">Pickup Details:</h3>
          <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${pickupDate}</p>
          <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${pickupTime}</p>
          ${request.order_number ? `<p style="margin: 10px 0;"><strong>📋 Order Number:</strong> ${request.order_number}</p>` : ''}
          ${request.verification_code ? `<p style="margin: 10px 0;"><strong>🔑 Verification Code:</strong> ${request.verification_code}</p>` : ''}
          <p style="margin: 10px 0;"><strong>💰 Total Amount:</strong> ₱${request.approved_price?.toFixed(2) || '0.00'}</p>
        </div>

        <p><strong>Important Notes:</strong></p>
        <ul>
          <li>Please bring your verification code for easy pickup</li>
          <li>Arrive within the scheduled time to ensure your cake is at its best</li>
          <li>Contact us if you need to reschedule</li>
        </ul>

        <p>We look forward to seeing you tomorrow!</p>

        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>GoldenMunch Team</strong><br>
          📞 ${process.env.BUSINESS_PHONE || 'Contact us'}<br>
          📧 ${process.env.EMAIL_USER || 'Email us'}
        </p>
      </div>
    `;

    try {
      // Insert reminder notification
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
         VALUES (?, 'reminder', ?, ?, ?, 'pending')`,
        [request.request_id, request.customer_email, subject, messageBody]
      );

      const notificationId = result.insertId;

      // Send immediately
      await this.sendNotification({
        notification_id: notificationId,
        request_id: request.request_id,
        notification_type: 'reminder',
        recipient_email: request.customer_email,
        subject,
        message_body: messageBody,
        status: 'pending',
      });

      console.log(`✅ Pickup reminder sent to ${request.customer_email}`);
    } catch (error) {
      console.error('Error creating pickup reminder:', error);
    }
  }

  /**
   * Send admin notification for new custom cake request
   */
  async notifyAdminNewRequest(requestId: number): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) {
      console.warn('No admin email configured');
      return;
    }

    try {
      // Get request details
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_request WHERE request_id = ?`,
        [requestId]
      );

      if (requests.length === 0) {
        return;
      }

      const request = requests[0];

      const subject = `🔔 New Custom Cake Request #${requestId}`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">🔔 New Custom Cake Request</h2>

          <p>A new custom cake request has been submitted and is awaiting your review.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #FF6B35;">Request Details:</h3>
            <p><strong>Request ID:</strong> ${request.request_id}</p>
            <p><strong>Customer:</strong> ${request.customer_name}</p>
            <p><strong>Email:</strong> ${request.customer_email}</p>
            <p><strong>Phone:</strong> ${request.customer_phone}</p>
            <p><strong>Layers:</strong> ${request.num_layers}</p>
            <p><strong>Estimated Price:</strong> ₱${request.estimated_price?.toFixed(2) || '0.00'}</p>
            <p><strong>Submitted:</strong> ${new Date(request.submitted_at).toLocaleString()}</p>
          </div>

          <p><strong>Action Required:</strong> Please review this request in the admin panel and approve or reject it.</p>

          <a href="${process.env.BACKEND_URL}/admin/custom-cakes/${requestId}"
             style="display: inline-block; background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Review Request
          </a>
        </div>
      `;

      await this.sendEmail({
        to: adminEmail,
        subject,
        html: messageBody,
      });

      console.log(`✅ Admin notified of new request #${requestId}`);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
