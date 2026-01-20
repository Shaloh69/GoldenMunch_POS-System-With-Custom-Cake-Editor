import { Resend } from 'resend';
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
  private resend: Resend | null = null;
  private isConfigured: boolean = false;
  private fromEmail: string = '';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  Email service not configured. Set RESEND_API_KEY in .env');
      this.isConfigured = false;
      return;
    }

    try {
      // Initialize Resend client with API key
      this.resend = new Resend(process.env.RESEND_API_KEY);

      // Set from email (must be verified domain in Resend)
      // Format: "Name <email@domain.com>" or just "email@domain.com"
      const fromName = process.env.EMAIL_FROM_NAME || 'GoldenMunch POS';
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || '[email protected]';
      this.fromEmail = `${fromName} <${fromAddress}>`;

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully with Resend');
      console.log(`📧 From address: ${this.fromEmail}`);
      console.log('📧 Using Resend API for reliable email delivery');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send an email using Resend API
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      console.warn('❌ Email service not configured. Email not sent to:', options.to);
      console.warn('   💡 Check RESEND_API_KEY and EMAIL_FROM_ADDRESS in .env.production');
      return false;
    }

    try {
      // Send email using Resend SDK
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      if (error) {
        console.error('❌ Resend API error:', error);

        // Provide specific error guidance
        if (error.name === 'validation_error') {
          console.error('   💡 Validation error - check email addresses are valid');
        } else if (error.message?.includes('Domain') || error.message?.includes('domain')) {
          console.error('   ⚠️  DOMAIN NOT VERIFIED!');
          console.error('   💡 Go to https://resend.com/domains and verify:', this.fromEmail.split('@')[1]);
          console.error('   💡 Quick fix: Use "onboarding@resend.dev" in EMAIL_FROM_ADDRESS');
        } else if (error.message?.includes('Unable to fetch') || error.message?.includes('could not be resolved')) {
          console.error('   ⚠️  CONNECTION ERROR - Possible causes:');
          console.error('   1. Domain "' + this.fromEmail.split('@')[1] + '" not verified in Resend');
          console.error('   2. Network/firewall blocking Resend API');
          console.error('   3. Invalid API key');
          console.error('   💡 QUICK FIX: Change EMAIL_FROM_ADDRESS to "onboarding@resend.dev"');
        }

        return false;
      }

      console.log('✅ Email sent successfully via Resend:', data?.id);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);

      // Provide helpful error messages
      if (error.message?.includes('API key')) {
        console.error('   💡 Invalid API key - check RESEND_API_KEY in .env');
      } else if (error.message?.includes('domain')) {
        console.error('   💡 Domain not verified - verify your domain in Resend dashboard');
      } else if (error.message?.includes('rate limit')) {
        console.error('   💡 Rate limit exceeded - wait before sending more emails');
      } else if (error.message?.includes('fetch')) {
        console.error('   💡 Network error - check internet connection or use onboarding@resend.dev');
      }

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
         AND sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
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
          📧 ${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'Email us'}
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

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;
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

      // Get associated images
      const [images] = await pool.query<RowDataPacket[]>(
        `SELECT image_url, image_type, view_angle FROM custom_cake_images
         WHERE request_id = ? ORDER BY uploaded_at ASC`,
        [requestId]
      );

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

      // Build image gallery HTML
      let imageGalleryHtml = '';
      if (images.length > 0) {
        const imageRows = images.map((img: any) => {
          // Handle different image URL formats:
          // 1. data: URLs (base64-encoded images) - use directly
          // 2. http/https URLs - use directly
          // 3. Relative paths - prepend backend URL
          let fullImageUrl = img.image_url;
          if (!fullImageUrl.startsWith('data:') && !fullImageUrl.startsWith('http')) {
            fullImageUrl = `${backendUrl}${img.image_url}`;
          }

          return `
            <div style="display: inline-block; margin: 10px; text-align: center; vertical-align: top;">
              <img src="${fullImageUrl}"
                   alt="${img.view_angle} view"
                   style="width: 180px; height: 180px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd; display: block;" />
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #666; text-transform: capitalize;">${img.view_angle}</p>
            </div>
          `;
        }).join('');

        imageGalleryHtml = `
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #FF6B35;">3D Preview Images:</h3>
            <div style="text-align: center;">
              ${imageRows}
            </div>
          </div>
        `;
      }

      // Add reference image if exists
      let referenceImageHtml = '';
      if (request.reference_image) {
        // Handle different image URL formats (data:, http, or relative path)
        let refImageUrl = request.reference_image;
        if (!refImageUrl.startsWith('data:') && !refImageUrl.startsWith('http')) {
          refImageUrl = `${backendUrl}${request.reference_image}`;
        }

        referenceImageHtml = `
          <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #fed7aa;">
            <h3 style="margin-top: 0; color: #ea580c;">Customer Reference Image:</h3>
            <p style="font-size: 14px; color: #9a3412; margin-bottom: 10px;">📸 Customer provided this for design inspiration</p>
            <div style="text-align: center;">
              <img src="${refImageUrl}"
                   alt="Reference design"
                   style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 2px solid #fed7aa;" />
            </div>
          </div>
        `;
      }

      // Format submission date nicely
      const submittedDate = new Date(request.submitted_at).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Format event date if provided
      let eventDateHtml = '';
      if (request.event_date) {
        const eventDate = new Date(request.event_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        eventDateHtml = `<p style="margin: 10px 0;"><strong>🎉 Event Date:</strong> ${eventDate}</p>`;
      }

      // Build customization details
      let customizationHtml = '';
      if (request.frosting_type || request.cake_text || request.theme_id || request.special_instructions) {
        const details = [];
        if (request.frosting_type) details.push(`Frosting: ${request.frosting_type}`);
        if (request.frosting_color) details.push(`Color: ${request.frosting_color}`);
        if (request.cake_text) details.push(`Text: "${request.cake_text}"`);
        if (request.candles_count && request.candles_count > 0) details.push(`Candles: ${request.candles_count}`);
        if (request.event_type) details.push(`Event: ${request.event_type}`);

        if (details.length > 0) {
          customizationHtml = `
            <div style="background-color: #FFF7ED; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F97316;">
              <h3 style="margin-top: 0; color: #EA580C;">🎨 Customization Details:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                ${details.map(detail => `<li>${detail}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      }

      // Special instructions
      let instructionsHtml = '';
      if (request.special_instructions) {
        instructionsHtml = `
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0; color: #92400E;"><strong>📝 Special Instructions:</strong></p>
            <p style="margin: 10px 0 0 0; color: #92400E;">${request.special_instructions}</p>
          </div>
        `;
      }

      // Dietary restrictions
      let dietaryHtml = '';
      if (request.dietary_restrictions) {
        dietaryHtml = `
          <div style="background-color: #ECFDF5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <p style="margin: 0; color: #065F46;"><strong>🥗 Dietary Restrictions:</strong></p>
            <p style="margin: 10px 0 0 0; color: #065F46;">${request.dietary_restrictions}</p>
          </div>
        `;
      }

      const subject = `🔔 New Custom Cake Request #${requestId} - Review Required`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Request!</h1>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
            <p style="font-size: 16px;">A new custom cake request has been submitted and is awaiting your review.</p>

            <div style="background-color: #F5F5F5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35;">
              <h3 style="margin-top: 0; color: #FF6B35;">👤 Customer Information:</h3>
              <p style="margin: 10px 0;"><strong>Request ID:</strong> #${request.request_id}</p>
              <p style="margin: 10px 0;"><strong>Name:</strong> ${request.customer_name}</p>
              <p style="margin: 10px 0;"><strong>📧 Email:</strong> ${request.customer_email}</p>
              <p style="margin: 10px 0;"><strong>📞 Phone:</strong> ${request.customer_phone || 'Not provided'}</p>
              <p style="margin: 10px 0;"><strong>📅 Submitted:</strong> ${submittedDate}</p>
              ${eventDateHtml}
            </div>

            <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
              <h3 style="margin-top: 0; color: #1D4ED8;">🎂 Cake Specifications:</h3>
              <p style="margin: 10px 0;"><strong>Number of Layers:</strong> ${request.num_layers}</p>
              <p style="margin: 10px 0;"><strong>💰 Estimated Price:</strong> ₱${request.estimated_price ? Number(request.estimated_price).toFixed(2) : '0.00'}</p>
              ${request.total_height_cm ? `<p style="margin: 10px 0;"><strong>Height:</strong> ${request.total_height_cm} cm</p>` : ''}
              ${request.base_diameter_cm ? `<p style="margin: 10px 0;"><strong>Base Diameter:</strong> ${request.base_diameter_cm} cm</p>` : ''}
            </div>

            ${customizationHtml}
            ${instructionsHtml}
            ${dietaryHtml}
            ${referenceImageHtml}
            ${imageGalleryHtml}

            <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #1E3A8A; font-weight: bold;">⚠️ Action Required: Please review and respond within 24-48 hours</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${backendUrl}/admin/custom-cakes/${requestId}"
                 style="display: inline-block; background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📋 Review Request Now
              </a>
            </div>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">GoldenMunch Admin Panel</p>
            <p style="margin: 5px 0 0 0;">Respond promptly to maintain customer satisfaction!</p>
          </div>
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
          <p style="margin: 0;">📧 ${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'goldenmunch@example.com'}</p>
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
          <p style="margin: 0;">📧 ${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'goldenmunch@example.com'}</p>
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
          <p style="margin: 0;">📧 ${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'goldenmunch@example.com'}</p>
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
   * Send "Under Review" status email
   */
  async sendUnderReviewEmail(requestId: number, requestData: {
    customer_email: string;
    customer_name: string;
    submitted_at: string;
    estimated_review_hours?: number;
  }): Promise<void> {
    const submittedDate = new Date(requestData.submitted_at).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Calculate estimated review completion time (default 24-48 hours)
    const reviewHours = requestData.estimated_review_hours || 48;
    const estimatedReviewDate = new Date(requestData.submitted_at);
    estimatedReviewDate.setHours(estimatedReviewDate.getHours() + reviewHours);
    const estimatedDate = estimatedReviewDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const subject = '🔍 Your Custom Cake Request is Under Review';
    const messageBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔍 Under Review</h1>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px;">Dear ${requestData.customer_name},</p>

          <p style="font-size: 16px;">Thank you for submitting your custom cake request <strong>#${requestId}</strong>!</p>

          <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1D4ED8;">📋 Request Status:</h3>
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #3B82F6; font-weight: bold;">Under Review</span></p>
            <p style="margin: 10px 0;"><strong>📅 Submitted:</strong> ${submittedDate}</p>
            <p style="margin: 10px 0;"><strong>⏱️ Estimated Review Time:</strong> ${reviewHours} hours</p>
            <p style="margin: 10px 0;"><strong>📆 Expected Response By:</strong> ${estimatedDate}</p>
          </div>

          <h3 style="color: #1D4ED8; margin-top: 30px;">What's Next:</h3>
          <ol style="line-height: 1.8; font-size: 15px;">
            <li>Our team is carefully reviewing your design requirements</li>
            <li>We're calculating the final pricing based on your specifications</li>
            <li>We're checking our schedule for optimal preparation time</li>
            <li>You'll receive an email with approval details or clarification questions</li>
          </ol>

          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0; color: #92400E;"><strong>💡 Tip:</strong> We typically respond within 24-48 hours. You'll receive an email as soon as we've completed the review!</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            <strong>Need to make changes?</strong> Contact us immediately if you need to modify your request before we start the review process.
          </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 10px 0;">Best regards,<br><strong>The GoldenMunch Team</strong></p>
          <p style="margin: 0;">📧 ${process.env.EMAIL_FROM_ADDRESS || 'goldenmunch@example.com'}</p>
          <p style="margin: 5px 0 0 0;">📞 ${process.env.BUSINESS_PHONE || 'Contact us'}</p>
        </div>
      </div>
    `;

    try {
      const success = await this.sendEmail({
        to: requestData.customer_email,
        subject,
        html: messageBody,
      });

      if (success) {
        console.log(`✅ Under review email sent to ${requestData.customer_email}`);
      }
    } catch (error) {
      console.error('Error sending under review email:', error);
    }
  }

  /**
   * Send "In Progress" status email
   */
  async sendInProgressEmail(requestId: number, progressData: {
    customer_email: string;
    customer_name: string;
    started_at: string;
    estimated_completion_date: string;
    estimated_completion_time?: string;
    progress_notes?: string;
  }): Promise<void> {
    const startedDate = new Date(progressData.started_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const completionDate = new Date(progressData.estimated_completion_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const completionTime = progressData.estimated_completion_time || 'during business hours';

    // Calculate days until completion
    const now = new Date();
    const completion = new Date(progressData.estimated_completion_date);
    const daysUntilReady = Math.ceil((completion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const subject = '👨‍🍳 Your Custom Cake is Being Prepared!';
    const messageBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">👨‍🍳 In Progress!</h1>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px;">Dear ${progressData.customer_name},</p>

          <p style="font-size: 16px;">Exciting news! Our bakers have started working on your custom cake <strong>#${requestId}</strong>!</p>

          <div style="background-color: #F5F3FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
            <h3 style="margin-top: 0; color: #6D28D9;">🎂 Production Status:</h3>
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #8B5CF6; font-weight: bold;">In Progress</span></p>
            <p style="margin: 10px 0;"><strong>🚀 Started:</strong> ${startedDate}</p>
            <p style="margin: 10px 0;"><strong>📅 Estimated Completion:</strong> ${completionDate}</p>
            <p style="margin: 10px 0;"><strong>🕐 Expected Ready Time:</strong> ${completionTime}</p>
            ${daysUntilReady > 0 ? `<p style="margin: 10px 0;"><strong>⏳ Days Until Ready:</strong> ${daysUntilReady} day(s)</p>` : ''}
          </div>

          ${progressData.progress_notes ? `
            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <p style="margin: 0; color: #92400E;"><strong>📝 From Our Bakers:</strong></p>
              <p style="margin: 10px 0 0 0; color: #92400E;">${progressData.progress_notes}</p>
            </div>
          ` : ''}

          <h3 style="color: #6D28D9; margin-top: 30px;">What's Happening Now:</h3>
          <ul style="line-height: 1.8; font-size: 15px;">
            <li>🥣 Preparing premium ingredients</li>
            <li>🎨 Creating your custom design elements</li>
            <li>👨‍🍳 Baking with love and attention to detail</li>
            <li>✨ Adding your special decorations and personalization</li>
          </ul>

          <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <p style="margin: 0; color: #1E3A8A;"><strong>💡 Next Step:</strong> You'll receive another email when your cake is ready for pickup!</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            <strong>Questions?</strong> Feel free to contact us anytime during the preparation process.
          </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 10px 0;">Best regards,<br><strong>The GoldenMunch Team</strong></p>
          <p style="margin: 0;">📧 ${process.env.EMAIL_FROM_ADDRESS || 'goldenmunch@example.com'}</p>
          <p style="margin: 5px 0 0 0;">📞 ${process.env.BUSINESS_PHONE || 'Contact us'}</p>
        </div>
      </div>
    `;

    try {
      const success = await this.sendEmail({
        to: progressData.customer_email,
        subject,
        html: messageBody,
      });

      if (success) {
        console.log(`✅ In progress email sent to ${progressData.customer_email}`);
      }
    } catch (error) {
      console.error('Error sending in progress email:', error);
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      console.error('Email service not configured');
      return false;
    }

    try {
      // Test by attempting to send a test email to the admin
      const testEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM_ADDRESS;
      if (!testEmail) {
        console.error('No test email configured');
        return false;
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [testEmail],
        subject: 'Resend Email Service Test',
        html: '<p>This is a test email to verify Resend integration is working correctly.</p>',
      });

      if (error) {
        console.error('❌ Email connection test failed:', error);
        return false;
      }

      console.log('✅ Email connection verified - Test email sent:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Email connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
