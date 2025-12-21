import type {
  CustomerOrder,
  OrderTimelineEntry,
  UpdateOrderStatusRequest,
  VerifyPaymentRequest,
} from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class OrderService {
  // Cashier endpoints
  static async getOrders(status?: string) {
    return apiClient.get<CustomerOrder[]>("/cashier/orders", {
      params: { status },
    });
  }

  static async getOrderById(id: number) {
    return apiClient.get<CustomerOrder>(`/cashier/orders/${id}`);
  }

  static async getOrderTimeline(id: number) {
    return apiClient.get<OrderTimelineEntry[]>(
      `/cashier/orders/${id}/timeline`,
    );
  }

  static async verifyOrder(code: string) {
    return apiClient.post("/cashier/orders/verify", {
      verification_code: code,
    });
  }

  static async updateOrderStatus(id: number, data: UpdateOrderStatusRequest) {
    return apiClient.patch(`/cashier/orders/${id}/status`, data);
  }

  static async createOrder(data: any) {
    return apiClient.post("/kiosk/orders", data);
  }

  static async verifyPayment(data: VerifyPaymentRequest, qrCodeFile?: File) {
    if (qrCodeFile) {
      const formData = new FormData();

      formData.append("order_id", data.order_id.toString());
      formData.append("payment_method", data.payment_method);
      if (data.reference_number) {
        formData.append("reference_number", data.reference_number);
      }
      formData.append("qr_code", qrCodeFile);

      return apiClient.postFormData("/cashier/payment/verify", formData);
    }

    return apiClient.post("/cashier/payment/verify", data);
  }

  // Kiosk endpoints (for viewing)
  static async getOrderByCode(code: string) {
    return apiClient.get<CustomerOrder>(`/kiosk/orders/${code}`);
  }
}
