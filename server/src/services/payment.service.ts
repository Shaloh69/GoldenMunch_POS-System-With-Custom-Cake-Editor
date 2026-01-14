/**
 * Xendit Payment Gateway Service
 * Handles cashless payments via Xendit QR codes
 * Supports GCash, PayMaya, and other payment methods via QRIS
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

// Payment Request/Response Types
interface CreateQRCodeRequest {
  externalId: string;
  amount: number;
  callbackUrl?: string;
}

interface QRCodeResponse {
  success: boolean;
  qrId?: string;
  qrString?: string; // The QR code data to display
  externalId?: string;
  amount?: number;
  status?: string;
  message?: string;
  error?: string;
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
      logger.info('✓ Xendit payment gateway initialized');
    } else {
      logger.warn('⚠ Xendit configuration missing - using mock mode for development');
    }
  }

  /**
   * Create Xendit QR Code for payment
   * Returns QR code string that can be displayed as QR image
   */
  async createQRCode(request: CreateQRCodeRequest): Promise<QRCodeResponse> {
    try {
      if (!this.xenditClient) {
        // Mock mode for development
        const mockQRString = `XENDIT_MOCK_${Date.now()}_${request.externalId}`;
        logger.info(`🧪 Mock QR Code created: ${mockQRString}`);

        return {
          success: true,
          qrId: `qr_mock_${Date.now()}`,
          qrString: mockQRString,
          externalId: request.externalId,
          amount: request.amount,
          status: 'ACTIVE',
          message: 'Mock QR code created (API not configured)',
        };
      }

      // Create Xendit Dynamic QR Code
      const response = await this.xenditClient.post('/qr_codes', {
        external_id: request.externalId,
        type: 'DYNAMIC', // Dynamic QR for specific amount
        callback_url: `${this.webhookUrl}/api/webhooks/xendit/qr-payment`,
        amount: request.amount,
      });

      logger.info(`✓ Xendit QR Code created: ${response.data.id}`);

      return {
        success: true,
        qrId: response.data.id,
        qrString: response.data.qr_string, // This is what we display as QR code
        externalId: response.data.external_id,
        amount: response.data.amount,
        status: response.data.status,
        message: 'QR code created successfully',
      };
    } catch (error: any) {
      logger.error('❌ Xendit QR code creation failed:', error.response?.data || error.message);
      return {
        success: false,
        status: 'INACTIVE',
        error: error.response?.data?.message || error.message || 'Failed to create QR code',
      };
    }
  }

  /**
   * Get QR code payment status
   */
  async getQRCodeStatus(qrId: string): Promise<PaymentVerificationResult> {
    try {
      if (!this.xenditClient) {
        // Mock mode - return pending status
        return {
          success: false,
          status: 'pending',
          message: 'Payment gateway not configured (mock mode)',
        };
      }

      const response = await this.xenditClient.get(`/qr_codes/${qrId}`);
      const qrCode = response.data;

      // Check if QR code has been paid
      const isPaid = qrCode.status === 'COMPLETED';

      return {
        success: isPaid,
        status: this.mapQRStatus(qrCode.status),
        amount: qrCode.amount,
        transactionDate: qrCode.completed_at || qrCode.updated,
        message: isPaid ? 'Payment completed' : 'Payment pending',
      };
    } catch (error: any) {
      logger.error('❌ Failed to get QR code status:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Failed to check payment status',
      };
    }
  }

  /**
   * Verify payment by external ID (order number)
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

      // Get QR code by external_id
      const response = await this.xenditClient.get(`/qr_codes`, {
        params: {
          external_id: orderId,
        },
      });

      if (!response.data || response.data.length === 0) {
        return {
          success: false,
          status: 'pending',
          message: 'No payment found for this order',
        };
      }

      const qrCode = response.data[0];
      return this.getQRCodeStatus(qrCode.id);
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
   * Map Xendit QR status to standard status
   */
  private mapQRStatus(status: string): 'pending' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
      'ACTIVE': 'pending',
      'COMPLETED': 'completed',
      'INACTIVE': 'failed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Simulate payment (for testing/mock mode)
   */
  async simulatePayment(qrId: string): Promise<boolean> {
    if (qrId.startsWith('qr_mock_')) {
      logger.info(`🧪 Simulating payment completion for mock QR: ${qrId}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const paymentService = new XenditPaymentService();
