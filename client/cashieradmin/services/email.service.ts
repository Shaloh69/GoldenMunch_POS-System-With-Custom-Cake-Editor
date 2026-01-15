import { apiClient } from "../lib/api-client";

export interface EmailRecord {
  notification_id: number;
  request_id: number;
  notification_type: 'submission_received' | 'approved' | 'rejected' | 'ready_for_pickup' | 'reminder' | 'admin_message';
  sender_type: 'customer' | 'admin' | 'system';
  sender_name?: string;
  recipient_email: string;
  subject: string;
  message_body: string;
  sent_at: Date | string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  customer_name?: string;
  request_email?: string;
}

export interface EmailsResponse {
  emails: EmailRecord[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface EmailStats {
  total_emails: number;
  sent_count: number;
  pending_count: number;
  failed_count: number;
  submission_emails: number;
  approved_emails: number;
  rejected_emails: number;
  pickup_emails: number;
  reminder_emails: number;
}

export interface SendEmailData {
  request_id?: number;
  recipient_email: string;
  subject: string;
  message_body: string;
  notification_type?: string;
}

export class EmailService {
  /**
   * Get all emails with pagination and filtering
   */
  static async getAllEmails(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    notification_type?: string;
    request_id?: number;
    search?: string;
  }) {
    return apiClient.get<EmailsResponse>("/admin/emails", { params });
  }

  /**
   * Get email statistics
   */
  static async getEmailStats() {
    return apiClient.get<EmailStats>("/admin/emails/stats");
  }

  /**
   * Get email by ID
   */
  static async getEmailById(id: number) {
    return apiClient.get<EmailRecord>(`/admin/emails/${id}`);
  }

  /**
   * Send custom email
   */
  static async sendCustomEmail(data: SendEmailData) {
    return apiClient.post("/admin/emails/send", data);
  }

  /**
   * Retry failed email
   */
  static async retryEmail(id: number) {
    return apiClient.post(`/admin/emails/${id}/retry`);
  }

  /**
   * Delete email record
   */
  static async deleteEmail(id: number) {
    return apiClient.delete(`/admin/emails/${id}`);
  }

  /**
   * Format email status for display
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'sent':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  }

  /**
   * Format notification type for display
   */
  static getNotificationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'submission_received': 'Submission Received',
      'approved': 'Request Approved',
      'rejected': 'Request Rejected',
      'ready_for_pickup': 'Ready for Pickup',
      'reminder': 'Pickup Reminder',
      'admin_message': 'Admin Message',
    };
    return labels[type] || type;
  }

  /**
   * Get notification type color
   */
  static getNotificationTypeColor(type: string): string {
    switch (type) {
      case 'submission_received':
        return 'primary';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'ready_for_pickup':
        return 'secondary';
      case 'reminder':
        return 'warning';
      case 'admin_message':
        return 'default';
      default:
        return 'default';
    }
  }

  /**
   * Format date/time
   */
  static formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Strip HTML tags from message body for preview
   */
  static stripHtml(html: string, maxLength: number = 100): string {
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Generate HTML email template
   */
  static generateEmailTemplate(message: string, additionalInfo?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🥐 GoldenMunch</h1>
          <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Custom Cake Creations</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e5;">
          ${message}
        </div>

        ${additionalInfo ? `
          <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
            ${additionalInfo}
          </div>
        ` : ''}

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border: 1px solid #e5e5e5; border-top: none;">
          <p style="margin: 0 0 10px 0;">Best regards,<br><strong>The GoldenMunch Team</strong></p>
          <p style="margin: 0;">📧 ${process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'goldenmunch@example.com'}</p>
          <p style="margin: 5px 0 0 0;">📞 ${process.env.NEXT_PUBLIC_BUSINESS_PHONE || 'Contact us'}</p>
        </div>
      </div>
    `;
  }
}
