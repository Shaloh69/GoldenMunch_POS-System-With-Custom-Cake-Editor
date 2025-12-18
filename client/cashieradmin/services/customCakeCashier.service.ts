import { apiClient } from '@/lib/api-client';

/**
 * Approved Custom Cake (ready for payment)
 */
export interface ApprovedCustomCake {
  request_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  num_layers: number;
  approved_price: number;
  scheduled_pickup_date: string;
  scheduled_pickup_time?: string;
  preparation_days: number;
  status: string;
  special_instructions?: string;
  order_id?: number;
}

/**
 * Payment Request Data
 */
export interface ProcessPaymentData {
  payment_method: 'cash' | 'gcash' | 'maya';
  amount_paid: number;
}

/**
 * Custom Cake Cashier Service - Payment processing
 */
export class CustomCakeCashierService {
  /**
   * Get all approved custom cakes ready for payment
   */
  static async getApprovedCakes(): Promise<ApprovedCustomCake[]> {
    const response = await apiClient.get<ApprovedCustomCake[]>('/cashier/custom-cakes/approved');
    return response.data || [];
  }

  /**
   * Process payment for an approved custom cake
   */
  static async processPayment(
    requestId: number,
    data: ProcessPaymentData
  ): Promise<{ order_id: number }> {
    const response = await apiClient.post<{ order_id: number }>(
      `/cashier/custom-cakes/${requestId}/process-payment`,
      data
    );
    // Check if response was successful
    if (!response.success) {
      throw new Error(response.message || response.error || 'Failed to process payment');
    }  // Ensure data exists
    if (!response.data) {
      throw new Error('No data returned from payment processing');
    }
    return response.data;
  }

  /**
   * Format price to Philippine Peso
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  }

  /**
   * Calculate change amount
   */
  static calculateChange(amountPaid: number, totalAmount: number): number {
    return Math.max(0, amountPaid - totalAmount);
  }

  /**
   * Validate payment amount
   */
  static isValidPayment(amountPaid: number, totalAmount: number): boolean {
    return amountPaid >= totalAmount && amountPaid > 0;
  }
}

export default CustomCakeCashierService;
