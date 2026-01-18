import apiClient from "@/config/api";
import type {
  CreateOrderRequest,
  CustomerOrder,
  ApiResponse,
} from "@/types/api";

/**
 * Order Service - Handles all order-related API calls
 */
export class OrderService {
  /**
   * Create a new order
   */
  static async createOrder(
    orderData: CreateOrderRequest,
  ): Promise<CustomerOrder> {
    try {
      const response = await apiClient.post<ApiResponse<CustomerOrder>>(
        "/kiosk/orders",
        orderData,
      );
      if (!response.data.data) {
        throw new Error("Failed to create order");
      }
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating order:", error);

      // Network/connection errors
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error(
            "Unable to connect to the server. Please check your internet connection and try again. " +
            "If the problem persists, please contact staff for assistance."
          );
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          throw new Error(
            "Connection timed out. The server may be experiencing issues. " +
            "Please try again in a moment or contact staff for assistance."
          );
        }
        throw new Error(
          "Network error occurred. Please check your connection and try again."
        );
      }

      // Server errors with custom message
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      // Generic server error
      if (error.response?.status >= 500) {
        throw new Error(
          "Server error occurred. Please try again or contact staff for assistance."
        );
      }

      throw error;
    }
  }

  /**
   * Get order by verification code
   */
  static async getOrderByCode(code: string): Promise<CustomerOrder> {
    try {
      const response = await apiClient.get<ApiResponse<CustomerOrder>>(
        `/kiosk/orders/${code}`,
      );
      if (!response.data.data) {
        throw new Error("Order not found");
      }
      return response.data.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }

  /**
   * Get order by ID (for order confirmation page)
   */
  static async getOrderById(id: number): Promise<CustomerOrder> {
    try {
      const response = await apiClient.get<ApiResponse<CustomerOrder>>(
        `/kiosk/orders/id/${id}`,
      );
      if (!response.data.data) {
        throw new Error("Order not found");
      }
      return response.data.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }

  /**
   * Mark QR code as scanned (called when customer views order confirmation)
   */
  static async markQRScanned(orderId: number): Promise<void> {
    try {
      await apiClient.post(`/kiosk/orders/${orderId}/mark-qr-scanned`);
    } catch (error) {
      console.error("Error marking QR as scanned:", error);
      // Don't throw - this is not critical for the user experience
    }
  }

  /**
   * Check if QR code has been scanned
   */
  static async checkQRStatus(orderId: number): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ qr_scanned: boolean }>>(
        `/kiosk/orders/${orderId}/qr-status`,
      );
      return response.data.data?.qr_scanned || false;
    } catch (error) {
      console.error("Error checking QR status:", error);
      return false;
    }
  }
}

export default OrderService;
