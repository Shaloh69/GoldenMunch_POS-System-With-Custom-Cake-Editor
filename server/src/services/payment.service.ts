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
        },
        auth: {
          username: process.env.XENDIT_SECRET_KEY,
          password: '', // Xendit uses API key as username with empty password
        },
      });
      logger.info('✓ Xendit QR Codes API (V1) initialized for QRPH');
    } else {
      logger.warn('⚠ Xendit configuration missing - using mock mode for development');
    }
  }

  /**
   * Create Xendit QR Code for QRPH payments (V1 API)
   * Returns QR code string that can be scanned with GCash, PayMaya, or any PH bank app
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

      // Use QR Codes V1 API for QRPH (simpler, more reliable)
      // This API directly returns qr_string in the response
      // Documentation: https://developers.xendit.co/api-reference/#create-qr-code

      const paymentMethod = 'QRPH'; // QR Philippines standard

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

      // Create QR Code using V1 API (simpler structure)
      const requestBody = {
        external_id: request.externalId,
        type: 'DYNAMIC',
        currency: 'PHP',
        channel_code: paymentMethod,
        amount: request.amount,
        callback_url: `${this.webhookUrl}/api/webhooks/xendit/qr-payment`,
      };

      logger.info(`📤 Creating ${paymentMethod} QR code:`, {
        external_id: request.externalId,
        amount: request.amount,
        channel_code: paymentMethod,
        callback_url: requestBody.callback_url,
      });

      const response = await this.xenditClient.post('/qr_codes', requestBody);

      const qrData = response.data;

      logger.info(`✓ Xendit QR Code created: ${qrData.id}`);
      logger.info(`QR Status: ${qrData.status}`);
      logger.info(`Full Xendit Response:`, JSON.stringify(qrData, null, 2));

      // Extract QR string from root level (V1 API structure)
      const qrString = qrData.qr_string;

      if (!qrString) {
        logger.error(`❌ CRITICAL: No qr_string in response!`);
        logger.error(`QR ID: ${qrData.id}`);
        logger.error(`QR Status: ${qrData.status}`);
        logger.error(`Full response:`, JSON.stringify(qrData, null, 2));

        return {
          success: false,
          status: 'FAILED',
          error: 'Xendit did not return QR code data. Check payment method configuration.',
          rawResponse: qrData,
        };
      }

      logger.info(`✅ QR Code extracted successfully (length: ${qrString.length})`);

      return {
        success: true,
        qrId: qrData.id,
        qrString: qrString,
        externalId: qrData.reference_id,
        amount: qrData.amount,
        status: qrData.status,
        message: 'QR code created successfully',
        rawResponse: qrData,
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
   * Get QR code status (V1 API)
   */
  async getQRCodeStatus(qrCodeId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        // Mock mode - return pending status
        return {
          success: false,
          status: 'pending',
          message: 'Payment gateway not configured (mock mode)',
        };
      }

      const response = await this.xenditClient.get(`/qr_codes/${qrCodeId}`);
      const qrData = response.data;

      logger.info(`QR Code ${qrCodeId} status: ${qrData.status}`);

      // Check if payment has been completed
      // V1 API statuses: ACTIVE, INACTIVE, DELETED
      // For QRPH, when scanned and paid, the callback webhook is triggered
      // The status might remain ACTIVE, so we need to check via callback/webhook
      const isPaid = qrData.status === 'COMPLETED' || qrData.status === 'PAID';

      return {
        success: isPaid,
        status: this.mapQRCodeStatus(qrData.status),
        amount: qrData.amount,
        transactionDate: qrData.updated || qrData.created,
        paymentMethod: qrData.channel_code || 'QRPH',
        message: isPaid ? 'Payment completed' : `QR code ${qrData.status.toLowerCase()}`,
      };
    } catch (error: any) {
      logger.error('❌ Failed to get QR code status:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Failed to check QR code status',
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
   * Map Xendit QR Code status to standard status (V1 API)
   */
  private mapQRCodeStatus(status: string): 'pending' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
      'ACTIVE': 'pending',
      'COMPLETED': 'completed',
      'PAID': 'completed',
      'INACTIVE': 'failed',
      'DELETED': 'failed',
      'EXPIRED': 'failed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Map Xendit Payment Request status to standard status (V3 API - legacy)
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
