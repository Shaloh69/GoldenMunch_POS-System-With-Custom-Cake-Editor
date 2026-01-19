/**
 * Xendit Payment Gateway Service
 * Handles cashless payments via Xendit Invoice API
 * Supports QRPH and other payment methods in the Philippines
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';
import QRCode from 'qrcode';

// Payment Request/Response Types
interface CreateInvoiceRequest {
  externalId: string;
  amount: number;
  description?: string;
  payerEmail?: string;
}

interface InvoiceResponse {
  success: boolean;
  invoiceId?: string;
  invoiceUrl?: string; // Xendit checkout page URL
  qrCodeDataUrl?: string; // Base64 QR code image to display on kiosk
  externalId?: string;
  amount?: number;
  status?: string;
  expiryDate?: string;
  message?: string;
  error?: string;
  rawResponse?: any; // Store full Xendit response for debugging
}

interface PaymentVerificationResult {
  success: boolean;
  status: 'pending' | 'completed' | 'failed';
  amount?: number;
  transactionDate?: string;
  paymentMethod?: string;
  message?: string;
  error?: string;
}

class XenditPaymentService {
  private xenditClient: AxiosInstance | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:5000';
    this.initializeGateway();
  }

  /**
   * Initialize Xendit payment gateway client
   */
  private initializeGateway(): void {
    if (process.env.XENDIT_SECRET_KEY) {
      this.xenditClient = axios.create({
        baseURL: 'https://api.xendit.co',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.XENDIT_SECRET_KEY,
          password: '', // Xendit uses API key as username with empty password
        },
      });
      logger.info('✓ Xendit Invoice API initialized for QRPH payments');
    } else {
      logger.warn('⚠ Xendit configuration missing - using mock mode for development');
    }
  }

  /**
   * Create Xendit Invoice for QRPH payments
   * Returns invoice URL and generates QR code for kiosk display
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResponse> {
    try {
      if (!this.xenditClient) {
        // Mock mode for development
        const mockInvoiceUrl = `https://checkout.xendit.co/web/mock_${Date.now()}`;
        logger.info(`🧪 Mock Invoice created: ${mockInvoiceUrl}`);

        // Generate QR code for mock URL
        const qrCodeDataUrl = await QRCode.toDataURL(mockInvoiceUrl, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 300,
          margin: 2,
        });

        return {
          success: true,
          invoiceId: `invoice_mock_${Date.now()}`,
          invoiceUrl: mockInvoiceUrl,
          qrCodeDataUrl: qrCodeDataUrl,
          externalId: request.externalId,
          amount: request.amount,
          status: 'PENDING',
          message: 'Mock invoice created (API not configured)',
        };
      }

      // Validate QRPH amount limits (₱1.00 to ₱50,000.00)
      if (request.amount < 1.00) {
        logger.error(`QRPH minimum amount is ₱1.00, received: ₱${request.amount}`);
        return {
          success: false,
          status: 'FAILED',
          error: 'Payment amount must be at least ₱1.00 for QRPH',
        };
      }
      if (request.amount > 50000.00) {
        logger.error(`QRPH maximum amount is ₱50,000.00, received: ₱${request.amount}`);
        return {
          success: false,
          status: 'FAILED',
          error: 'Payment amount cannot exceed ₱50,000.00 for QRPH',
        };
      }

      // Create Invoice using Xendit Invoice API
      const requestBody = {
        external_id: request.externalId,
        amount: request.amount,
        currency: 'PHP',
        payer_email: request.payerEmail || 'customer@goldenmunch.com',
        description: request.description || 'GoldenMunch Order Payment',
        payment_methods: ['QRPH'],
        success_redirect_url: `${this.baseUrl}/api/payment/success`,
        failure_redirect_url: `${this.baseUrl}/api/payment/failed`,
        invoice_duration: 172800, // 48 hours
      };

      logger.info(`📤 Creating Xendit Invoice:`, {
        external_id: request.externalId,
        amount: request.amount,
        payment_methods: ['QRPH'],
      });

      const response = await this.xenditClient.post('/v2/invoices', requestBody);
      const invoiceData = response.data;

      logger.info(`✓ Xendit Invoice created: ${invoiceData.id}`);
      logger.info(`Invoice Status: ${invoiceData.status}`);
      logger.info(`Invoice URL: ${invoiceData.invoice_url}`);

      // Generate QR code from invoice URL for kiosk display
      const qrCodeDataUrl = await QRCode.toDataURL(invoiceData.invoice_url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
      });

      logger.info(`✅ QR Code generated from invoice URL`);

      return {
        success: true,
        invoiceId: invoiceData.id,
        invoiceUrl: invoiceData.invoice_url,
        qrCodeDataUrl: qrCodeDataUrl,
        externalId: invoiceData.external_id,
        amount: invoiceData.amount,
        status: invoiceData.status,
        expiryDate: invoiceData.expiry_date,
        message: 'Invoice created successfully',
        rawResponse: invoiceData,
      };
    } catch (error: any) {
      const xenditError = error.response?.data;
      logger.error('❌ Xendit Invoice creation failed:');
      logger.error('Status:', error.response?.status);
      logger.error('Xendit Error:', JSON.stringify(xenditError, null, 2));
      logger.error('Request details:', {
        externalId: request.externalId,
        amount: request.amount,
      });

      return {
        success: false,
        status: 'FAILED',
        error: xenditError?.message || xenditError?.error_code || error.message || 'Failed to create invoice',
        rawResponse: xenditError,
      };
    }
  }

  /**
   * Get Invoice status
   */
  async getInvoiceStatus(invoiceId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        // Mock mode - return pending status
        return {
          success: false,
          status: 'pending',
          message: 'Payment gateway not configured (mock mode)',
        };
      }

      const response = await this.xenditClient.get(`/v2/invoices/${invoiceId}`);
      const invoiceData = response.data;

      logger.info(`Invoice ${invoiceId} status: ${invoiceData.status}`);

      // Invoice API statuses: PENDING, PAID, EXPIRED, SETTLED
      const isPaid = invoiceData.status === 'PAID' || invoiceData.status === 'SETTLED';

      return {
        success: isPaid,
        status: this.mapInvoiceStatus(invoiceData.status),
        amount: invoiceData.amount,
        transactionDate: invoiceData.updated || invoiceData.created,
        paymentMethod: 'QRPH',
        message: isPaid ? 'Payment completed' : `Invoice ${invoiceData.status.toLowerCase()}`,
      };
    } catch (error: any) {
      logger.error('❌ Failed to get invoice status:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Failed to check invoice status',
      };
    }
  }

  /**
   * Verify payment by external ID (order number)
   * Note: Payment Request API doesn't support querying by reference_id directly
   * We need to store the payment_request_id when creating the payment
   */
  async verifyPaymentByOrderId(orderId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        return {
          success: false,
          status: 'pending',
          message: 'Payment gateway not configured',
        };
      }

      // Payment Request API doesn't support direct lookup by reference_id
      // This should be called with payment_request_id instead
      logger.warn(`⚠ verifyPaymentByOrderId called with order ID: ${orderId}`);
      logger.warn(`Payment Request API requires payment_request_id, not reference_id`);

      return {
        success: false,
        status: 'pending',
        message: 'Use payment request ID to verify status',
      };
    } catch (error: any) {
      logger.error('❌ Failed to verify payment:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: 'Failed to verify payment',
      };
    }
  }

  /**
   * Map Xendit Invoice status to standard status
   */
  private mapInvoiceStatus(status: string): 'pending' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
      'PENDING': 'pending',
      'PAID': 'completed',
      'SETTLED': 'completed',
      'EXPIRED': 'failed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Simulate payment (for testing/mock mode)
   */
  async simulatePayment(invoiceId: string): Promise<boolean> {
    if (invoiceId.startsWith('invoice_mock_')) {
      logger.info(`🧪 Simulating payment completion for mock invoice: ${invoiceId}`);
      return true;
    }
    return false;
  }
}

// Export types
export type { CreateInvoiceRequest, InvoiceResponse, PaymentVerificationResult };

// Export singleton instance
export const paymentService = new XenditPaymentService();
