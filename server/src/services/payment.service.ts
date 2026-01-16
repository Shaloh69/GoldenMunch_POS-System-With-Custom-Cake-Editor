/**
 * Xendit Payment Gateway Service
 * Handles cashless payments via Xendit Payment Request API v3
 * Supports GCash, PayMaya, and other payment methods in the Philippines
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';

// Payment Request/Response Types
interface CreateQRCodeRequest {
  externalId: string;
  amount: number;
  callbackUrl?: string;
  paymentMethod?: 'GCASH' | 'PAYMAYA';
}

interface QRCodeResponse {
  success: boolean;
  qrId?: string;
  qrString?: string; // The QR code data to display
  redirectUrl?: string; // For e-wallets like GCash that redirect
  externalId?: string;
  amount?: number;
  status?: string;
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
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.API_URL || 'http://localhost:5000';
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
          'api-version': '2022-07-31', // Payment Request API version
        },
        auth: {
          username: process.env.XENDIT_SECRET_KEY,
          password: '', // Xendit uses API key as username with empty password
        },
      });
      logger.info('✓ Xendit Payment Request API v3 initialized');
    } else {
      logger.warn('⚠ Xendit configuration missing - using mock mode for development');
    }
  }

  /**
   * Create Xendit Payment Request for GCash/PayMaya
   * Returns QR code string or redirect URL depending on payment method
   */
  async createQRCode(request: CreateQRCodeRequest): Promise<QRCodeResponse> {
    try {
      if (!this.xenditClient) {
        // Mock mode for development
        const mockQRString = `XENDIT_MOCK_${Date.now()}_${request.externalId}`;
        logger.info(`🧪 Mock Payment Request created: ${mockQRString}`);

        return {
          success: true,
          qrId: `pr_mock_${Date.now()}`,
          qrString: mockQRString,
          externalId: request.externalId,
          amount: request.amount,
          status: 'PENDING',
          message: 'Mock payment request created (API not configured)',
        };
      }

      // Determine payment method - default to GCash for QR payments
      const paymentMethod = request.paymentMethod || 'GCASH';

      // Create Payment Request using v3 API
      // Documentation: https://docs.xendit.co/apidocs/create-payment-request
      const requestBody = {
        reference_id: request.externalId,
        amount: request.amount,
        currency: 'PHP',
        country: 'PH',
        payment_method: {
          type: 'EWALLET',
          ewallet: {
            channel_code: paymentMethod,
            channel_properties: {
              success_redirect_url: `${this.webhookUrl}/payment/success`,
              failure_redirect_url: `${this.webhookUrl}/payment/failure`,
            },
          },
          reusability: 'ONE_TIME_USE',
        },
        metadata: {
          order_number: request.externalId,
        },
      };

      logger.info(`📤 Creating ${paymentMethod} payment request:`, {
        reference_id: request.externalId,
        amount: request.amount,
      });

      const response = await this.xenditClient.post('/payment_requests', requestBody);

      const paymentData = response.data;

      logger.info(`✓ Xendit Payment Request created: ${paymentData.id}`);
      logger.info(`Payment Status: ${paymentData.status}`);

      // Extract QR code or redirect URL from actions
      let qrString: string | undefined;
      let redirectUrl: string | undefined;

      if (paymentData.actions && paymentData.actions.length > 0) {
        for (const action of paymentData.actions) {
          // For QR codes (QRPH, QRIS)
          if (action.url_type === 'QR' || action.qr_checkout_string) {
            qrString = action.qr_checkout_string || action.url;
            logger.info(`✓ QR Code extracted from payment request`);
          }
          // For e-wallets that require redirect (GCash, PayMaya)
          else if (action.url_type === 'WEB' || action.url_type === 'DEEPLINK') {
            redirectUrl = action.url;
            logger.info(`✓ Redirect URL extracted: ${redirectUrl}`);
          }
        }
      }

      return {
        success: true,
        qrId: paymentData.id,
        qrString: qrString,
        redirectUrl: redirectUrl,
        externalId: paymentData.reference_id,
        amount: paymentData.amount,
        status: paymentData.status,
        message: 'Payment request created successfully',
        rawResponse: paymentData, // Store for debugging
      };
    } catch (error: any) {
      // Log the ACTUAL Xendit error, not our wrapped message
      const xenditError = error.response?.data;
      logger.error('❌ Xendit Payment Request creation failed:');
      logger.error('Status:', error.response?.status);
      logger.error('Xendit Error:', JSON.stringify(xenditError, null, 2));
      logger.error('Request details:', {
        externalId: request.externalId,
        amount: request.amount,
        paymentMethod: request.paymentMethod,
      });

      return {
        success: false,
        status: 'FAILED',
        error: xenditError?.message || xenditError?.error_code || error.message || 'Failed to create payment request',
        rawResponse: xenditError, // Return actual Xendit error
      };
    }
  }

  /**
   * Get payment request status
   */
  async getQRCodeStatus(paymentRequestId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        // Mock mode - return pending status
        return {
          success: false,
          status: 'pending',
          message: 'Payment gateway not configured (mock mode)',
        };
      }

      const response = await this.xenditClient.get(`/payment_requests/${paymentRequestId}`);
      const paymentData = response.data;

      logger.info(`Payment Request ${paymentRequestId} status: ${paymentData.status}`);

      // Check if payment has been completed
      const isPaid = paymentData.status === 'SUCCEEDED';

      return {
        success: isPaid,
        status: this.mapPaymentStatus(paymentData.status),
        amount: paymentData.amount,
        transactionDate: paymentData.updated || paymentData.created,
        paymentMethod: paymentData.payment_method?.ewallet?.channel_code || 'UNKNOWN',
        message: isPaid ? 'Payment completed' : `Payment ${paymentData.status.toLowerCase()}`,
      };
    } catch (error: any) {
      logger.error('❌ Failed to get payment status:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Failed to check payment status',
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
   * Map Xendit Payment Request status to standard status
   */
  private mapPaymentStatus(status: string): 'pending' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
      'PENDING': 'pending',
      'AWAITING_CAPTURE': 'pending',
      'SUCCEEDED': 'completed',
      'FAILED': 'failed',
      'EXPIRED': 'failed',
      'VOIDED': 'failed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Simulate payment (for testing/mock mode)
   */
  async simulatePayment(paymentRequestId: string): Promise<boolean> {
    if (paymentRequestId.startsWith('pr_mock_')) {
      logger.info(`🧪 Simulating payment completion for mock payment request: ${paymentRequestId}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const paymentService = new XenditPaymentService();
