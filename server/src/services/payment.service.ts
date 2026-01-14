/**
 * Payment Gateway Integration Service
 * Supports GCash and PayMaya payment processing
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

// Payment Gateway Configuration
interface PaymentConfig {
  apiUrl: string;
  clientId?: string;
  clientSecret?: string;
  publicKey?: string;
  secretKey?: string;
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
  message?: string;
  error?: string;
}

interface PaymentVerificationResult {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount?: number;
  transactionDate?: string;
  message?: string;
  error?: string;
}

class PaymentGatewayService {
  private gcashClient: AxiosInstance | null = null;
  private paymayaClient: AxiosInstance | null = null;
  private xenditClient: AxiosInstance | null = null;

  constructor() {
    this.initializeGateways();
  }

  /**
   * Initialize payment gateway clients
   */
  private initializeGateways(): void {
    // GCash Configuration
    if (process.env.GCASH_API_URL && process.env.GCASH_CLIENT_ID && process.env.GCASH_CLIENT_SECRET) {
      this.gcashClient = axios.create({
        baseURL: process.env.GCASH_API_URL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.GCASH_CLIENT_ID,
          password: process.env.GCASH_CLIENT_SECRET,
        },
      });
      logger.info('GCash payment gateway initialized');
    } else {
      logger.warn('GCash configuration missing - payment verification will use mock mode');
    }

    // PayMaya Configuration
    if (process.env.PAYMAYA_API_URL && process.env.PAYMAYA_PUBLIC_KEY && process.env.PAYMAYA_SECRET_KEY) {
      this.paymayaClient = axios.create({
        baseURL: process.env.PAYMAYA_API_URL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.PAYMAYA_PUBLIC_KEY,
          password: process.env.PAYMAYA_SECRET_KEY,
        },
      });
      logger.info('PayMaya payment gateway initialized');
    } else {
      logger.warn('PayMaya configuration missing - payment verification will use mock mode');
    }

    // Xendit Configuration
    if (process.env.XENDIT_API_URL && process.env.XENDIT_SECRET_KEY) {
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
      logger.info('Xendit payment gateway initialized');
    } else {
      logger.warn('Xendit configuration missing - payment verification will use mock mode');
    }
  }

  /**
   * Create GCash payment
   */
  async createGCashPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.gcashClient) {
        // Mock mode for development
        return {
          success: true,
          transactionId: `GCASH_MOCK_${Date.now()}`,
          referenceNumber: this.generateMockReference('GCASH'),
          status: 'pending',
          paymentUrl: `https://mock-gcash-payment.com/${Date.now()}`,
          message: 'Mock GCash payment created (API not configured)',
        };
      }

      const response = await this.gcashClient.post('/payments/create', {
        amount: {
          value: request.amount.toFixed(2),
          currency: request.currency || 'PHP',
        },
        description: request.description,
        requestReferenceNumber: request.orderId,
        metadata: {
          customerName: request.customerName,
          customerEmail: request.customerEmail,
          customerPhone: request.customerPhone,
        },
        redirectUrl: {
          success: request.callbackUrl + '/success',
          failure: request.callbackUrl + '/failed',
          cancel: request.callbackUrl + '/cancelled',
        },
      });

      return {
        success: true,
        transactionId: response.data.id,
        referenceNumber: response.data.referenceNumber,
        status: 'pending',
        paymentUrl: response.data.checkoutUrl,
        message: 'GCash payment created successfully',
      };
    } catch (error: any) {
      logger.error('GCash payment creation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'GCash payment creation failed',
      };
    }
  }

  /**
   * Create PayMaya payment
   */
  async createPayMayaPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.paymayaClient) {
        // Mock mode for development
        return {
          success: true,
          transactionId: `PAYMAYA_MOCK_${Date.now()}`,
          referenceNumber: this.generateMockReference('PAYMAYA'),
          status: 'pending',
          paymentUrl: `https://mock-paymaya-payment.com/${Date.now()}`,
          message: 'Mock PayMaya payment created (API not configured)',
        };
      }

      const response = await this.paymayaClient.post('/v1/checkouts', {
        totalAmount: {
          value: request.amount,
          currency: request.currency || 'PHP',
        },
        buyer: {
          firstName: request.customerName.split(' ')[0],
          lastName: request.customerName.split(' ').slice(1).join(' ') || '',
          contact: {
            phone: request.customerPhone,
            email: request.customerEmail,
          },
        },
        items: [
          {
            name: request.description,
            quantity: 1,
            amount: {
              value: request.amount,
            },
            totalAmount: {
              value: request.amount,
            },
          },
        ],
        requestReferenceNumber: request.orderId,
        redirectUrl: {
          success: request.callbackUrl + '/success',
          failure: request.callbackUrl + '/failed',
          cancel: request.callbackUrl + '/cancelled',
        },
      });

      return {
        success: true,
        transactionId: response.data.checkoutId,
        referenceNumber: response.data.referenceNumber,
        status: 'pending',
        paymentUrl: response.data.redirectUrl,
        message: 'PayMaya payment created successfully',
      };
    } catch (error: any) {
      logger.error('PayMaya payment creation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'PayMaya payment creation failed',
      };
    }
  }

  /**
   * Verify GCash payment
   */
  async verifyGCashPayment(referenceNumber: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.gcashClient) {
        // Mock mode - validate reference format
        if (this.validateMockReference(referenceNumber, 'GCASH')) {
          return {
            success: true,
            status: 'completed',
            amount: 0, // Amount would come from order
            transactionDate: new Date().toISOString(),
            message: 'Mock GCash payment verified (API not configured)',
          };
        } else {
          return {
            success: false,
            status: 'failed',
            error: 'Invalid GCash reference number format',
          };
        }
      }

      const response = await this.gcashClient.get(`/payments/${referenceNumber}`);

      return {
        success: response.data.status === 'PAYMENT_SUCCESS',
        status: this.mapGCashStatus(response.data.status),
        amount: parseFloat(response.data.amount?.value || '0'),
        transactionDate: response.data.createdAt,
        message: response.data.message,
      };
    } catch (error: any) {
      logger.error('GCash payment verification failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'GCash verification failed',
      };
    }
  }

  /**
   * Verify PayMaya payment
   */
  async verifyPayMayaPayment(referenceNumber: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.paymayaClient) {
        // Mock mode - validate reference format
        if (this.validateMockReference(referenceNumber, 'PAYMAYA')) {
          return {
            success: true,
            status: 'completed',
            amount: 0,
            transactionDate: new Date().toISOString(),
            message: 'Mock PayMaya payment verified (API not configured)',
          };
        } else {
          return {
            success: false,
            status: 'failed',
            error: 'Invalid PayMaya reference number format',
          };
        }
      }

      const response = await this.paymayaClient.get(`/v1/payments/${referenceNumber}`);

      return {
        success: response.data.status === 'PAYMENT_SUCCESS',
        status: this.mapPayMayaStatus(response.data.status),
        amount: response.data.amount,
        transactionDate: response.data.paymentAt,
        message: response.data.description,
      };
    } catch (error: any) {
      logger.error('PayMaya payment verification failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'PayMaya verification failed',
      };
    }
  }

  /**
   * Map GCash status to standard status
   */
  private mapGCashStatus(status: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled'> = {
      'PAYMENT_SUCCESS': 'completed',
      'PAYMENT_PENDING': 'pending',
      'PAYMENT_FAILED': 'failed',
      'PAYMENT_EXPIRED': 'failed',
      'PAYMENT_CANCELLED': 'cancelled',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Map PayMaya status to standard status
   */
  private mapPayMayaStatus(status: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled'> = {
      'PAYMENT_SUCCESS': 'completed',
      'FOR_AUTHENTICATION': 'pending',
      'AUTHENTICATING': 'pending',
      'AUTH_SUCCESS': 'completed',
      'AUTH_FAILED': 'failed',
      'PAYMENT_FAILED': 'failed',
      'PAYMENT_EXPIRED': 'failed',
      'VOIDED': 'cancelled',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Generate mock reference number for testing
   */
  private generateMockReference(gateway: 'GCASH' | 'PAYMAYA' | 'XENDIT'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${gateway}_${timestamp}_${random}`;
  }

  /**
   * Validate mock reference number format
   */
  private validateMockReference(reference: string, gateway: 'GCASH' | 'PAYMAYA' | 'XENDIT'): boolean {
    const pattern = new RegExp(`^${gateway}_\\d+_[A-Z0-9]+$`);
    return pattern.test(reference);
  }

  /**
   * Create Xendit payment invoice
   */
  async createXenditPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.xenditClient) {
        // Mock mode for development
        return {
          success: true,
          transactionId: `XENDIT_MOCK_${Date.now()}`,
          referenceNumber: this.generateMockReference('XENDIT'),
          status: 'pending',
          paymentUrl: `https://mock-xendit-payment.com/${Date.now()}`,
          message: 'Mock Xendit payment created (API not configured)',
        };
      }

      // Create Xendit Invoice
      const response = await this.xenditClient.post('/v2/invoices', {
        external_id: request.orderId,
        amount: request.amount,
        payer_email: request.customerEmail || 'customer@goldenmunch.com',
        description: request.description,
        currency: request.currency || 'PHP',
        customer: {
          given_names: request.customerName,
          mobile_number: request.customerPhone,
          email: request.customerEmail || 'customer@goldenmunch.com',
        },
        success_redirect_url: request.callbackUrl + '/success',
        failure_redirect_url: request.callbackUrl + '/failed',
        invoice_duration: 86400, // 24 hours expiry
      });

      return {
        success: true,
        transactionId: response.data.id,
        referenceNumber: response.data.external_id,
        status: 'pending',
        paymentUrl: response.data.invoice_url,
        message: 'Xendit invoice created successfully',
      };
    } catch (error: any) {
      logger.error('Xendit payment creation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Xendit payment creation failed',
      };
    }
  }

  /**
   * Verify Xendit payment
   */
  async verifyXenditPayment(invoiceId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        // Mock mode - validate reference format
        if (this.validateMockReference(invoiceId, 'XENDIT')) {
          return {
            success: true,
            status: 'completed',
            amount: 0,
            transactionDate: new Date().toISOString(),
            message: 'Mock Xendit payment verified (API not configured)',
          };
        } else {
          return {
            success: false,
            status: 'failed',
            error: 'Invalid Xendit reference number format',
          };
        }
      }

      const response = await this.xenditClient.get(`/v2/invoices/${invoiceId}`);

      return {
        success: response.data.status === 'PAID' || response.data.status === 'SETTLED',
        status: this.mapXenditStatus(response.data.status),
        amount: response.data.amount,
        transactionDate: response.data.paid_at || response.data.updated,
        message: response.data.description,
      };
    } catch (error: any) {
      logger.error('Xendit payment verification failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Xendit verification failed',
      };
    }
  }

  /**
   * Map Xendit status to standard status
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
}

// Export singleton instance
export const paymentService = new PaymentGatewayService();
