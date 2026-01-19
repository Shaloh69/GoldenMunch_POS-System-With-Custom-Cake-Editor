/**
 * Payment Service
 * Handles Xendit Invoice QR code generation and payment status checking
 */

import { API_BASE_URL } from '@/config/api';

interface CreateQRResponse {
  invoice_id: string;
  invoice_url: string;
  qr_code_image: string; // Base64 QR code image
  order_number: string;
  amount: number;
  expiry_date: string;
}

interface PaymentStatusResponse {
  paid: boolean;
  order_id: number;
  order_number: string;
  payment_status: string;
}

class PaymentService {
  /**
   * Create Xendit QR code for order payment
   */
  async createPaymentQR(orderId: number, amount: number): Promise<CreateQRResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment QR code');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      // Network/fetch errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Unable to connect to payment server. Please check your internet connection and try again.'
        );
      }

      // Re-throw other errors with original message
      throw error;
    }
  }

  /**
   * Check payment status for an order
   */
  async checkPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/status/${orderId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check payment status');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      // Network/fetch errors - silently fail and retry (handled by polling logic)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('Network error checking payment status, will retry...');
        throw new Error('Network error - retrying...');
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Poll payment status until completed or timeout
   * @param orderId Order ID to check
   * @param maxAttempts Maximum number of polling attempts (default: 120 = 10 minutes at 5s intervals)
   * @param interval Polling interval in milliseconds (default: 5000 = 5 seconds)
   * @returns Promise that resolves when payment is complete or rejects on timeout
   */
  async pollPaymentStatus(
    orderId: number,
    onStatusUpdate?: (status: PaymentStatusResponse) => void,
    maxAttempts: number = 120,
    interval: number = 5000
  ): Promise<PaymentStatusResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          attempts++;
          const status = await this.checkPaymentStatus(orderId);

          // Notify caller of status update
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }

          // Check if payment is complete
          if (status.paid) {
            resolve(status);
            return;
          }

          // Check if we've exceeded max attempts
          if (attempts >= maxAttempts) {
            reject(new Error('Payment timeout - please check with staff'));
            return;
          }

          // Continue polling
          setTimeout(checkStatus, interval);
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      checkStatus();
    });
  }
}

export default new PaymentService();
