import { Resend } from 'resend';
import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Webhook, WebhookRequiredHeaders } from 'svix';
import { sseService, SSEChannels, SSEEvents } from './sse.service';
import logger from '../utils/logger';
import EmailReplyParser from 'email-reply-parser';

// NOTE: dotenv is configured in app.ts - do NOT configure it here to avoid race conditions

interface InboundEmailEvent {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc?: string[];
    cc?: string[];
    message_id: string;
    subject: string;
    attachments?: Array<{
      id: string;
      filename: string;
      content_type: string;
      content_disposition: string;
      content_id?: string;
    }>;
  };
}

// Consolidated and more comprehensive type for Resend email.received events
export interface ResendEmailReceivedEvent {
  type: 'email.received';
  created_at: string;
  data: {
    attachments: any[];
    bcc: any[];
    cc: any[];
    created_at: string;
    email_id: string;
    from: string;
    message_id: string;
    subject: string;
    to: string[];
    text?: string; // Full plain text content of the email
    html?: string; // Full HTML content of the email
  };
}

interface EmailContent {
  html?: string;
  text?: string;
  headers?: Record<string, string | string[]>;
}
class InboundEmailService {
  private resend: Resend | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('⚠️  Inbound email service not configured. Set RESEND_API_KEY in .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.isConfigured = true;
      logger.info('✅ Inbound email service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize inbound email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Process inbound email webhook event
   */
  async processInboundEmail(event: ResendEmailReceivedEvent): Promise<void> {
    if (!this.isConfigured) {
      logger.warn('Inbound email service not configured. Skipping inbound email processing.');
      return;
    }

    try {
      logger.info('📨 Processing inbound email:', {
        email_id: event.data.email_id,
        from: event.data.from,
        subject: event.data.subject,
      });

      // Extract request ID from subject line
      const requestId = this.extractRequestId(event.data.subject);
      if (!requestId) {
        throw new Error(`Could not extract request ID from subject: ${event.data.subject}`);
      }
      logger.info('   Extracted Request ID:', { requestId, email_id: event.data.email_id });

      // Verify the request exists
      const [requests] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM custom_cake_request WHERE request_id = ?',
        [requestId]
      );

      if (requests.length === 0) {
        logger.warn('⚠️  Custom cake request not found for extracted ID. Ignoring email.', { requestId, subject: event.data.subject });
        return;
      }

      const request = requests[0];

      // Fetch full email content from Resend API
      // Prioritize content directly from the webhook event if available, otherwise fetch
      let emailContent: EmailContent | null = null;
      if (event.data.text || event.data.html) {
        emailContent = { text: event.data.text, html: event.data.html };
      } else {
        emailContent = await this.fetchEmailContent(event.data.email_id);
      }

      if (!emailContent || (!emailContent.text && !emailContent.html)) {
        logger.error('❌ Failed to fetch email content or content is empty.', { email_id: event.data.email_id });
        throw new Error('Failed to fetch email content or content is empty.');
      }

      // Extract sender email
      const senderEmail = this.extractEmail(event.data.from);

      // Verify sender is the customer
      if (request.customer_email && senderEmail.toLowerCase() !== request.customer_email.toLowerCase()) {
        logger.warn('⚠️  Email from unauthorized sender. Ignoring email.', {
          senderEmail, customerEmail: request.customer_email, email_id: event.data.email_id
        });
        throw new Error('Email from unauthorized sender.');
      }

      // Parse the email body to extract the actual reply (remove quoted text)
      const replyText = this.extractReplyText(emailContent.text || emailContent.html || '');

      if (!replyText || replyText.trim().length === 0) {
        throw new Error('No reply text found in email after parsing.');
      }
      logger.info('Successfully parsed reply from email body', {
        email_id: event.data.email_id,
        originalLength: (emailContent.text || emailContent.html || '').length,
        parsedLength: replyText.length,
      });

      // Save customer reply to database
      await this.saveCustomerReply({
        requestId,
        customerName: request.customer_name,
        customerEmail: request.customer_email,
        subject: `Re: Custom Cake Request #${requestId}`, // Subject for the notification record
        messageBody: replyText,
      });

      logger.info('✅ Customer reply saved successfully', {
        email_id: event.data.email_id, requestId, customerEmail: request.customer_email
      });
    } catch (error) {
      logger.error('❌ Error processing inbound email:', { error: error instanceof Error ? error.message : error, email_id: event.data.email_id });
      throw error; // Re-throw to ensure the webhook controller's catch block also logs it
    }
  }

  /**
   * Fetch full email content from Resend API
   * This is a fallback if the webhook event itself doesn't contain full text/html.
   */
  private async fetchEmailContent(emailId: string): Promise<EmailContent | null> {
    if (!this.resend) {
      logger.warn('Resend service not initialized. Cannot fetch email content.', { emailId });
      return null;
    }

    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await this.resend.emails.get(emailId);

        // If there's an error from the API
        if (error) {
          // If it's a 404 (not_found) and we haven't exhausted retries, wait and try again.
          // This handles a potential race condition where the webhook arrives before the email is queryable via API.
          if (error.name === 'not_found' && attempt < maxRetries) {
            logger.warn(`Attempt ${attempt}: Email not found via API, retrying in ${retryDelay / 1000}s...`, { emailId });
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue; // Next attempt
          }
          // For other errors or on the last attempt, log and exit the loop.
          logger.error('❌ Failed to fetch email content from Resend:', { error, emailId });
          return null;
        }

        // If we get a response but it has no data or no content
        if (!data || (!data.html && !data.text)) {
          logger.error('❌ No text or html content in Resend API response', { emailId });
          return null;
        }

        // Success!
        logger.info(`✅ Successfully fetched email content on attempt ${attempt}`, { emailId });
        return {
          html: data.html ?? undefined,
          text: data.text ?? undefined,
        };

      } catch (exception) {
        logger.error('❌ Exception while fetching email content from Resend:', { error: exception instanceof Error ? exception.message : exception, emailId });
        // If an unexpected exception occurs, it's probably not recoverable by retrying, so we exit.
        return null;
      }
    }

    // This line is reached only if all retries fail with a 404.
    logger.error(`❌ Failed to fetch email content after ${maxRetries} attempts.`, { emailId });
    return null;
  }

  /**
   * Extract request ID from email subject
   * Looks for patterns like "#123" or "Request #123" or "Custom Cake Request #123"
   */
  private extractRequestId(subject: string): number | null {
    if (!subject) return null;
    // Try multiple patterns
    const patterns = [
      /request\s*#?(\d+)/i,               // Request #123 or Request 123
      /#(\d+)/,                           // #123 (less specific, put after more specific ones)
    ];

    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match && match[1]) {
        const id = parseInt(match[1], 10);
        if (!isNaN(id) && id > 0) {
          return id;
        }
      }
    }

    return null;
  }

  /**
   * Extract email address from "Name <email@example.com>" format
   */
  private extractEmail(emailString: string): string {
    const match = emailString.match(/<(.+?)>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return emailString.trim();
  }

  /**
   * Extract the actual reply text, removing quoted previous messages
   * This handles common email client quote patterns using email-reply-parser.
   */
  private extractReplyText(content: string): string {
    if (!content) return '';

    // Use email-reply-parser to clean the content
    // It handles both plain text and HTML content intelligently
    const replyParser = new EmailReplyParser();
    // The .read() method returns an Email object, on which we can call .getVisibleText()
    // to extract only the new reply text, stripping signatures and quoted history.
    const email = new EmailReplyParser().read(content);
    const cleanText = email.getVisibleText();

    return cleanText.trim();
  }

  /**
   * Save customer reply to database
   */
  private async saveCustomerReply(data: {
    requestId: number;
    customerName: string;
    customerEmail: string;
    subject: string;
    messageBody: string;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;

    try {
      // Insert customer message into database
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO custom_cake_notifications
        (request_id, notification_type, sender_type, sender_name, recipient_email, subject, message_body, status, is_read)
        VALUES (?, 'message', 'customer', ?, ?, ?, ?, 'received', FALSE)`, // Status 'received' for inbound messages
        [
          data.requestId,
          data.customerName,
          adminEmail, // Recipient is the admin system
          data.subject,
          data.messageBody,
        ]
      );

      const notificationId = result.insertId;

      // Get the newly created message for broadcasting
      const [newMessage] = await pool.query<RowDataPacket[]>(
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

      // Broadcast SSE event for real-time updates to relevant admin/cashier users
      sseService.broadcast(SSEChannels.CUSTOM_CAKES, SSEEvents.CUSTOM_CAKE_MESSAGE_RECEIVED, {
        request_id: data.requestId,
        message: newMessage[0],
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ Customer reply saved to database (ID: ${notificationId})`, { requestId: data.requestId, notificationId });
    } catch (error) {
      logger.error('❌ Failed to save customer reply to database:', { error: error instanceof Error ? error.message : error, data });
      throw error; // Re-throw to ensure the calling function handles it
    }
  }

  /**
   * Verify webhook signature (for security)
   * Uses Svix webhook verification.
   * @param payload The raw request body string.
   * @param headers The Svix headers from the request.
   * @returns True if the signature is valid, false otherwise.
   */  
  verifyWebhookSignature(payload: string, headers: WebhookRequiredHeaders): boolean {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('⚠️  RESEND_WEBHOOK_SECRET is not configured. Webhook signature verification is skipped. THIS IS A SECURITY RISK IN PRODUCTION!');
      // In development, we might allow this for easier testing. In production, it should always fail.
      return process.env.NODE_ENV !== 'production';
    }

    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(payload, headers); // This will throw an error if verification fails
      logger.info('✅ Webhook signature verified successfully.');
      return true;
    } catch (error) {
      logger.error('❌ Webhook signature verification failed:', {
        error: error instanceof Error ? error.message : error,
        svixId: headers['svix-id'],
      });
      return false;
    }
  }
}

// Export singleton instance
export const inboundEmailService = new InboundEmailService();
