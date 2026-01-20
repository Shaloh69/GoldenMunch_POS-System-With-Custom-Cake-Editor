import { Resend } from 'resend';
import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sseService, SSEChannels, SSEEvents } from './sse.service';

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
      console.warn('⚠️  Inbound email service not configured. Set RESEND_API_KEY in .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.isConfigured = true;
      console.log('✅ Inbound email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize inbound email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Process inbound email webhook event
   */
  async processInboundEmail(event: InboundEmailEvent): Promise<void> {
    if (!this.isConfigured || !this.resend) {
      console.warn('Inbound email service not configured');
      return;
    }

    try {
      console.log('📨 Processing inbound email:', event.data.email_id);
      console.log('   From:', event.data.from);
      console.log('   Subject:', event.data.subject);

      // Extract request ID from subject line
      const requestId = this.extractRequestId(event.data.subject);
      if (!requestId) {
        console.log('⚠️  Could not extract request ID from subject:', event.data.subject);
        return;
      }

      console.log('   Extracted Request ID:', requestId);

      // Verify the request exists
      const [requests] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM custom_cake_request WHERE request_id = ?',
        [requestId]
      );

      if (requests.length === 0) {
        console.log('⚠️  Request not found:', requestId);
        return;
      }

      const request = requests[0];

      // Fetch full email content from Resend API
      const emailContent = await this.fetchEmailContent(event.data.email_id);
      if (!emailContent) {
        console.error('❌ Failed to fetch email content');
        return;
      }

      // Extract sender email
      const senderEmail = this.extractEmail(event.data.from);

      // Verify sender is the customer
      if (senderEmail.toLowerCase() !== request.customer_email.toLowerCase()) {
        console.log('⚠️  Email from unauthorized sender:', senderEmail);
        return;
      }

      // Parse the email body to extract the actual reply (remove quoted text)
      const replyText = this.extractReplyText(emailContent.text || emailContent.html || '');

      if (!replyText || replyText.trim().length === 0) {
        console.log('⚠️  No reply text found in email');
        return;
      }

      // Save customer reply to database
      await this.saveCustomerReply({
        requestId,
        customerName: request.customer_name,
        customerEmail: request.customer_email,
        subject: `Re: Custom Cake Request #${requestId}`,
        messageBody: replyText,
      });

      console.log('✅ Customer reply saved successfully');
    } catch (error) {
      console.error('❌ Error processing inbound email:', error);
      throw error;
    }
  }

  /**
   * Fetch full email content from Resend API
   */
  private async fetchEmailContent(emailId: string): Promise<EmailContent | null> {
    if (!this.resend) {
      return null;
    }

    try {
      // Use Resend SDK to fetch email content
      const response = await this.resend.emails.receiving.get(emailId);

      if (!response.data) {
        console.error('❌ No data in Resend API response');
        return null;
      }

      return {
        html: response.data.html,
        text: response.data.text,
        headers: response.data.headers as Record<string, string | string[]>,
      };
    } catch (error) {
      console.error('❌ Failed to fetch email content from Resend:', error);
      return null;
    }
  }

  /**
   * Extract request ID from email subject
   * Looks for patterns like "#123" or "Request #123" or "Custom Cake Request #123"
   */
  private extractRequestId(subject: string): number | null {
    // Try multiple patterns
    const patterns = [
      /#(\d+)/,                           // #123
      /Request\s+#?(\d+)/i,               // Request #123 or Request 123
      /Custom\s+Cake\s+Request\s+#?(\d+)/i, // Custom Cake Request #123
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
   * This handles common email client quote patterns
   */
  private extractReplyText(content: string): string {
    if (!content) {
      return '';
    }

    // Strip HTML tags if HTML content
    let textContent = content;
    if (content.includes('<') && content.includes('>')) {
      textContent = this.stripHtml(content);
    }

    // Common quote markers to split on
    const quoteMarkers = [
      /^On .+ wrote:$/m,                    // "On Mon, Jan 1, 2024 at 10:00 AM, John wrote:"
      /^From:.+Sent:.+To:.+Subject:/ms,     // Outlook-style headers
      /^[-_]{3,}/m,                          // Horizontal lines (---, ___)
      /^>{1,}/m,                             // Quote markers (>, >>)
      /^\s*Original Message\s*$/mi,         // "Original Message"
      /^\s*-{3,}\s*Forwarded message\s*-{3,}/mi, // Forwarded message
    ];

    let replyText = textContent;

    // Find the first quote marker and take everything before it
    for (const marker of quoteMarkers) {
      const match = replyText.match(marker);
      if (match && match.index !== undefined) {
        replyText = replyText.substring(0, match.index);
        break;
      }
    }

    // Clean up the text
    replyText = replyText
      .trim()
      .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double
      .replace(/^\s+|\s+$/gm, '')  // Trim each line
      .trim();

    return replyText;
  }

  /**
   * Strip HTML tags for plain text extraction
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')  // Remove style tags
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
      .replace(/<[^>]+>/g, '')                       // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')                       // Replace &nbsp;
      .replace(/&amp;/g, '&')                        // Replace &amp;
      .replace(/&lt;/g, '<')                         // Replace &lt;
      .replace(/&gt;/g, '>')                         // Replace &gt;
      .replace(/&quot;/g, '"')                       // Replace &quot;
      .replace(/\s+/g, ' ')                          // Collapse whitespace
      .trim();
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
        VALUES (?, 'message', 'customer', ?, ?, ?, ?, 'sent', FALSE)`,
        [
          data.requestId,
          data.customerName,
          adminEmail,
          data.subject,
          data.messageBody,
        ]
      );

      const notificationId = result.insertId;

      // Get the newly created message
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

      // Broadcast SSE event for real-time updates
      sseService.broadcast(SSEChannels.CUSTOM_CAKES, SSEEvents.CUSTOM_CAKE_MESSAGE_RECEIVED, {
        request_id: data.requestId,
        message: newMessage[0],
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Customer reply saved to database (ID: ${notificationId})`);
    } catch (error) {
      console.error('❌ Failed to save customer reply:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature (for security)
   * Uses Svix webhook verification
   */
  verifyWebhookSignature(payload: string, headers: {
    'svix-id'?: string;
    'svix-timestamp'?: string;
    'svix-signature'?: string;
  }): boolean {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('⚠️  RESEND_WEBHOOK_SECRET not configured - skipping signature verification');
      return true; // Allow in development, but warn
    }

    try {
      // Resend uses Svix for webhook signatures
      // The signature verification is done by Svix library
      // For now, we'll implement basic verification
      // In production, use the Svix SDK for proper verification

      const svixId = headers['svix-id'];
      const svixTimestamp = headers['svix-timestamp'];
      const svixSignature = headers['svix-signature'];

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('❌ Missing required Svix headers');
        return false;
      }

      // TODO: Implement proper Svix signature verification using @svix/svix library
      // For now, we'll accept all requests if the headers are present
      // This is a security risk in production!
      console.log('⚠️  Webhook signature verification not fully implemented');
      console.log('   Install @svix/svix package for production use');

      return true;
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const inboundEmailService = new InboundEmailService();
