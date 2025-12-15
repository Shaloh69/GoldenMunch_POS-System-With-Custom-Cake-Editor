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
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
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
}

export default OrderService;
