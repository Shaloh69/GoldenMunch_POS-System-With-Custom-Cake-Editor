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
         ORDER BY sent_at ASC
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
         AND sent_at > DATE_SUB(NOW(), INTERVAL 24 HOURS)
         ORDER BY sent_at ASC
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
           AND DATE(sent_at) = CURDATE()
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
          <p style="margin: 10px 0;"><strong>💰 Total Amount:</strong> ₱${request.approved_price ? Number(request.approved_price).toFixed(2) : '0.00'}</p>
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
            <p><strong>Estimated Price:</strong> ₱${request.estimated_price ? Number(request.estimated_price).toFixed(2) : '0.00'}</p>
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
   * Send approval notification with improved template
   */
  async sendApprovalEmail(requestId: number, approvalData: {
    customer_email: string;
    customer_name: string;
    approved_price: number;
    scheduled_pickup_date: string;
    scheduled_pickup_time?: string;
    preparation_days: number;
    admin_notes?: string;
  }): Promise<void> {
    const pickupDate = new Date(approvalData.scheduled_pickup_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pickupTime = approvalData.scheduled_pickup_time || 'during business hours';

    const subject = '🎉 Your Custom Cake Request Has Been Approved!';
    const messageBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Request Approved!</h1>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px;">Dear ${approvalData.customer_name},</p>

          <p style="font-size: 16px;">Great news! We're excited to create your custom cake!</p>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="margin-top: 0; color: #059669;">Order Summary:</h3>
            <p style="margin: 10px 0;"><strong>💰 Final Price:</strong> ₱${Number(approvalData.approved_price).toFixed(2)}</p>
            <p style="margin: 10px 0;"><strong>📅 Pickup Date:</strong> ${pickupDate}</p>
            <p style="margin: 10px 0;"><strong>🕐 Pickup Time:</strong> ${pickupTime}</p>
            <p style="margin: 10px 0;"><strong>⏱️ Preparation Time:</strong> ${approvalData.preparation_days} day(s)</p>
          </div>

          ${approvalData.admin_notes ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>📝 Special Notes:</strong></p>
              <p style="margin: 10px 0 0 0; color: #92400e;">${approvalData.admin_notes}</p>
            </div>
          ` : ''}

          <h3 style="color: #059669; margin-top: 30px;">Next Steps:</h3>
          <ol style="line-height: 1.8;">
            <li>We will start preparing your custom cake</li>
            <li>You will receive a notification when it's ready for pickup</li>
            <li>Please arrive at the scheduled time to collect your cake</li>
          </ol>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            <strong>Important:</strong> If you need to make any changes or have questions, please contact us as soon as possible.
          </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 10px 0;">Best regards,<br><strong>The GoldenMunch Team</strong></p>
          <p style="margin: 0;">📧 ${process.env.EMAIL_USER || 'goldenmunch@example.com'}</p>
          <p style="margin: 5px 0 0 0;">📞 ${process.env.BUSINESS_PHONE || 'Contact us'}</p>
        </div>
      </div>
    `;

    try {
      const success = await this.sendEmail({
        to: approvalData.customer_email,
        subject,
        html: messageBody,
      });

      if (success) {
        console.log(`✅ Approval email sent to ${approvalData.customer_email}`);
      }
    } catch (error) {
      console.error('Error sending approval email:', error);
    }
  }

  /**
   * Send rejection notification with improved template
   */
  async sendRejectionEmail(requestId: number, rejectionData: {
    customer_email: string;
    customer_name: string;
    rejection_reason: string;
    admin_notes?: string;
  }): Promise<void> {
    const subject = 'Custom Cake Request Update';
    const messageBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Custom Cake Request Update</h1>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px;">Dear ${rejectionData.customer_name},</p>

          <p style="font-size: 16px;">Thank you for your interest in our custom cake services.</p>

          <p style="font-size: 16px;">After careful review, we regret to inform you that we are unable to fulfill your request at this time.</p>

          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong></p>
            <p style="margin: 10px 0 0 0; color: #991b1b;">${rejectionData.rejection_reason}</p>
          </div>

          ${rejectionData.admin_notes ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #374151;"><strong>Additional Information:</strong></p>
              <p style="margin: 10px 0 0 0; color: #374151;">${rejectionData.admin_notes}</p>
            </div>
          ` : ''}

          <p style="font-size: 16px; margin-top: 30px;">We appreciate your understanding and hope to serve you in the future with a different order.</p>

          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If you have any questions or would like to discuss alternative options, please don't hesitate to contact us.
          </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 10px 0;">Best regards,<br><strong>The GoldenMunch Team</strong></p>
          <p style="margin: 0;">📧 ${process.env.EMAIL_USER || 'goldenmunch@example.com'}</p>
          <p style="margin: 5px 0 0 0;">📞 ${process.env.BUSINESS_PHONE || 'Contact us'}</p>
        </div>
      </div>
    `;

    try {
      const success = await this.sendEmail({
        to: rejectionData.customer_email,
        subject,
        html: messageBody,
      });

      if (success) {
        console.log(`✅ Rejection email sent to ${rejectionData.customer_email}`);
      }
    } catch (error) {
      console.error('Error sending rejection email:', error);
    }
  }

  /**
   * Send "ready for pickup" notification
   */
  async sendReadyForPickupEmail(requestId: number, requestData: {
    customer_email: string;
    customer_name: string;
    scheduled_pickup_date: string;
    scheduled_pickup_time?: string;
    order_number?: string;
    verification_code?: string;
  }): Promise<void> {
    const pickupDate = new Date(requestData.scheduled_pickup_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pickupTime = requestData.scheduled_pickup_time || 'during business hours';

    const subject = '🎂 Your Custom Cake is Ready for Pickup!';
    const messageBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎂 Your Cake is Ready!</h1>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px;">Dear ${requestData.customer_name},</p>

          <p style="font-size: 16px;">Exciting news! Your beautiful custom cake is ready and waiting for you!</p>

          <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35;">
            <h3 style="margin-top: 0; color: #ea580c;">Pickup Details:</h3>
            <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${pickupDate}</p>
            <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${pickupTime}</p>
            ${requestData.order_number ? `<p style="margin: 10px 0;"><strong>📋 Order Number:</strong> ${requestData.order_number}</p>` : ''}
            ${requestData.verification_code ? `<p style="margin: 10px 0;"><strong>🔑 Verification Code:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #ea580c;">${requestData.verification_code}</span></p>` : ''}
          </div>

          <h3 style="color: #ea580c;">Important Reminders:</h3>
          <ul style="line-height: 1.8;">
            <li>Please bring your verification code for easy pickup</li>
            <li>Arrive within the scheduled time window</li>
            <li>Cakes taste best when consumed fresh</li>
            <li>Handle with care during transport</li>
          </ul>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>⚠️ Note:</strong> If you cannot make it at the scheduled time, please contact us immediately to reschedule.</p>
          </div>

          <p style="font-size: 16px; margin-top: 30px;">We can't wait for you to see your masterpiece!</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 10px 0;">Best regards,<br><strong>The GoldenMunch Team</strong></p>
          <p style="margin: 0;">📧 ${process.env.EMAIL_USER || 'goldenmunch@example.com'}</p>
          <p style="margin: 5px 0 0 0;">📞 ${process.env.BUSINESS_PHONE || 'Contact us'}</p>
        </div>
      </div>
    `;

    try {
      // Insert notification record
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
         VALUES (?, 'ready_for_pickup', ?, ?, ?, 'pending')`,
        [requestId, requestData.customer_email, subject, messageBody]
      );

      const notificationId = result.insertId;

      // Send immediately
      const success = await this.sendEmail({
        to: requestData.customer_email,
        subject,
        html: messageBody,
      });

      if (success) {
        await pool.query(
          `UPDATE custom_cake_notifications SET status = 'sent', sent_at = NOW() WHERE notification_id = ?`,
          [notificationId]
        );
        console.log(`✅ Ready for pickup email sent to ${requestData.customer_email}`);
      } else {
        await pool.query(
          `UPDATE custom_cake_notifications SET status = 'failed', error_message = 'Failed to send email' WHERE notification_id = ?`,
          [notificationId]
        );
      }
    } catch (error) {
      console.error('Error sending ready for pickup email:', error);
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
