/**
 * Printer Service - Browser-side wrapper for Electron printer functions
 * Provides a safe interface to call printer functions with fallbacks
 */

export interface ReceiptData {
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  verificationCode?: string;
  customerName?: string;
  specialInstructions?: string;
}

export interface ReportData {
  date: string;
  totalOrders: number;
  totalSales: number;
  paymentBreakdown: Record<string, number>;
  topItems: Array<{
    name: string;
    quantity: number;
  }>;
}

export interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
  suggestion?: string;
}

export interface PrinterStatus {
  available: boolean;
  connected: boolean;
  config: any;
}

class PrinterService {
  /**
   * Check if printer is available (Electron environment)
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' &&
           'electron' in window &&
           'printer' in (window as any).electron;
  }

  /**
   * Print order receipt
   */
  async printReceipt(orderData: ReceiptData): Promise<PrintResult> {
    if (!this.isAvailable()) {
      console.warn('Printer not available in this environment');
      return {
        success: false,
        error: 'Printer only available in Electron app'
      };
    }

    try {
      const result = await (window as any).electron.printer.printReceipt(orderData);
      return result;
    } catch (error: any) {
      console.error('Error printing receipt:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Print test receipt
   */
  async printTest(): Promise<PrintResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Printer only available in Electron app'
      };
    }

    try {
      const result = await (window as any).electron.printer.printTest();
      return result;
    } catch (error: any) {
      console.error('Error printing test:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Print daily sales report
   */
  async printDailyReport(reportData: ReportData): Promise<PrintResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Printer only available in Electron app'
      };
    }

    try {
      const result = await (window as any).electron.printer.printDailyReport(reportData);
      return result;
    } catch (error: any) {
      console.error('Error printing report:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<PrinterStatus> {
    if (!this.isAvailable()) {
      return {
        available: false,
        connected: false,
        config: null
      };
    }

    try {
      const status = await (window as any).electron.printer.getStatus();
      return status;
    } catch (error) {
      console.error('Error getting printer status:', error);
      return {
        available: false,
        connected: false,
        config: null
      };
    }
  }

  /**
   * Format order data for printing
   */
  formatOrderForPrint(order: any): ReceiptData {
    return {
      orderNumber: order.order_number || order.orderNumber || 'N/A',
      orderDate: new Date(order.order_datetime || order.orderDate || new Date()).toLocaleDateString(),
      items: (order.items || []).map((item: any) => ({
        name: item.name || item.item_name || 'Unknown Item',
        quantity: item.quantity || 1,
        price: parseFloat(item.price || item.unit_price || 0),
        specialInstructions: item.special_instructions || item.specialInstructions
      })),
      subtotal: parseFloat(order.total_amount || order.subtotal || 0),
      tax: parseFloat(order.tax_amount || order.tax || 0),
      discount: parseFloat(order.discount_amount || order.discount || 0),
      total: parseFloat(order.final_amount || order.total || 0),
      paymentMethod: order.payment_method || order.paymentMethod || 'Cash',
      verificationCode: order.verification_code || order.verificationCode,
      customerName: order.customer_name || order.customerName,
      specialInstructions: order.special_instructions || order.specialInstructions
    };
  }
}

// Export singleton instance
export const printerService = new PrinterService();
export default printerService;
