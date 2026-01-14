/**
 * Xendit Payment Gateway Service
 * Handles cashless payments via Xendit (supports GCash, PayMaya, Cards, etc.)
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

// Payment Gateway Configuration
interface PaymentConfig {
  apiUrl: string;
  secretKey: string;
}

// Payment Request/Response Types
interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderId: string;
  callbackUrl?: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  referenceNumber?: string;
  status: 'pending' | 'success' | 'failed';
  paymentUrl?: string;
  qrCodeUrl?: string;
  message?: string;
  error?: string;
}

interface PaymentVerificationResult {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount?: number;
  transactionDate?: string;
  paymentMethod?: string;
  message?: string;
  error?: string;
}

class XenditPaymentService {
  private xenditClient: AxiosInstance | null = null;

  constructor() {
    this.initializeGateway();
  }

  /**
   * Initialize Xendit payment gateway client
   */
  private initializeGateway(): void {
    if (process.env.XENDIT_SECRET_KEY) {
      this.xenditClient = axios.create({
        baseURL: process.env.XENDIT_API_URL || 'https://api.xendit.co',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.XENDIT_SECRET_KEY,
          password: '', // Xendit uses API key as username with empty password
        },
      });
      logger.info('✓ Xendit payment gateway initialized');
    } else {
      logger.warn('⚠ Xendit configuration missing - payment verification will use mock mode');
    }
  }

  /**
   * Create Xendit payment invoice
   * This generates a payment URL and QR code that supports multiple payment methods
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.xenditClient) {
        // Mock mode for development
        return {
          success: true,
          transactionId: `INV_MOCK_${Date.now()}`,
          referenceNumber: this.generateMockReference(),
          status: 'pending',
          paymentUrl: `https://mock-xendit.com/invoice/${Date.now()}`,
          qrCodeUrl: `https://mock-xendit.com/qr/${Date.now()}`,
          message: 'Mock Xendit invoice created (API not configured)',
        };
      }

      // Create Xendit Invoice with QR code enabled
      const response = await this.xenditClient.post('/v2/invoices', {
        external_id: request.orderId,
        amount: request.amount,
        payer_email: request.customerEmail || 'customer@goldenmunch.com',
        description: request.description,
        currency: request.currency || 'PHP',
        invoice_duration: 86400, // 24 hours expiry
        customer: {
          given_names: request.customerName || 'Customer',
          mobile_number: request.customerPhone || '',
          email: request.customerEmail || 'customer@goldenmunch.com',
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email'],
        },
        success_redirect_url: request.callbackUrl ? `${request.callbackUrl}/success` : undefined,
        failure_redirect_url: request.callbackUrl ? `${request.callbackUrl}/failed` : undefined,
        payment_methods: ['QRIS', 'EWALLET', 'CREDIT_CARD', 'BANK_TRANSFER'],
        fees: [
          {
            type: 'ADMIN',
            value: 0,
          },
        ],
      });

      return {
        success: true,
        transactionId: response.data.id,
        referenceNumber: response.data.external_id,
        status: 'pending',
        paymentUrl: response.data.invoice_url,
        qrCodeUrl: response.data.qr_code_url || response.data.invoice_url,
        message: 'Xendit invoice created successfully',
      };
    } catch (error: any) {
      logger.error('❌ Xendit invoice creation failed:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Failed to create payment invoice',
      };
    }
  }

  /**
   * Verify Xendit payment by invoice ID
   */
  async verifyPayment(invoiceId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        // Mock mode - validate reference format
        if (this.validateMockReference(invoiceId)) {
          return {
            success: true,
            status: 'completed',
            amount: 0,
            transactionDate: new Date().toISOString(),
            paymentMethod: 'MOCK',
            message: 'Mock payment verified (API not configured)',
          };
        } else {
          return {
            success: false,
            status: 'failed',
            error: 'Invalid payment reference format',
          };
        }
      }

      const response = await this.xenditClient.get(`/v2/invoices/${invoiceId}`);
      const invoice = response.data;

      return {
        success: invoice.status === 'PAID' || invoice.status === 'SETTLED',
        status: this.mapXenditStatus(invoice.status),
        amount: invoice.amount,
        transactionDate: invoice.paid_at || invoice.updated,
        paymentMethod: invoice.payment_method || 'UNKNOWN',
        message: invoice.description || 'Payment verified',
      };
    } catch (error: any) {
      logger.error('❌ Xendit payment verification failed:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Payment verification failed',
      };
    }
  }

  /**
   * Get payment details by external ID (order number)
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        return {
          success: false,
          status: 'pending',
          message: 'Payment gateway not configured',
        };
      }

      // Search for invoice by external_id
      const response = await this.xenditClient.get(`/v2/invoices`, {
        params: {
          external_id: orderId,
          limit: 1,
        },
      });

      if (!response.data || response.data.length === 0) {
        return {
          success: false,
          status: 'pending',
          error: 'No payment found for this order',
        };
      }

      const invoice = response.data[0];
      return this.verifyPayment(invoice.id);
    } catch (error: any) {
      logger.error('❌ Failed to get payment by order ID:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: 'Failed to retrieve payment information',
      };
    }
  }

  /**
   * Map Xendit invoice status to standard status
   */
  private mapXenditStatus(status: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled'> = {
      'PENDING': 'pending',
      'PAID': 'completed',
      'SETTLED': 'completed',
      'EXPIRED': 'failed',
      'FAILED': 'failed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Generate mock reference number for testing
   */
  private generateMockReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `XENDIT_${timestamp}_${random}`;
  }

  /**
   * Validate mock reference number format
   */
  private validateMockReference(reference: string): boolean {
    const pattern = /^XENDIT_\d+_[A-Z0-9]+$/;
    return pattern.test(reference);
  }
}

// Export singleton instance
export const paymentService = new XenditPaymentService();
