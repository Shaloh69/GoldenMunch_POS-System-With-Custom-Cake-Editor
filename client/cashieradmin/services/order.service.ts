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

  static async deleteOrder(id: number) {
    return apiClient.delete(`/cashier/orders/${id}`);
  }

  static async markOrderPrinted(id: number) {
    return apiClient.post(`/cashier/orders/${id}/mark-printed`);
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
      if (data.amount_paid !== undefined) {
        formData.append("amount_paid", data.amount_paid.toString());
      }
      if (data.change_amount !== undefined) {
        formData.append("change_amount", data.change_amount.toString());
      }
      if (data.customer_discount_type_id) {
        formData.append("customer_discount_type_id", data.customer_discount_type_id.toString());
      }
      formData.append("qr_code", qrCodeFile);

      return apiClient.postFormData("/cashier/payment/verify", formData);
    }

    return apiClient.post("/cashier/payment/verify", data);
  }

  // Admin endpoints
  static async getOrdersAdmin(status?: string) {
    return apiClient.get<CustomerOrder[]>("/admin/orders", {
      params: { status },
    });
  }

  static async getOrderByIdAdmin(id: number) {
    return apiClient.get<CustomerOrder>(`/admin/orders/${id}`);
  }

  static async getOrderTimelineAdmin(id: number) {
    return apiClient.get<OrderTimelineEntry[]>(
      `/admin/orders/${id}/timeline`,
    );
  }

  static async updateOrderStatusAdmin(id: number, data: UpdateOrderStatusRequest) {
    return apiClient.patch(`/admin/orders/${id}/status`, data);
  }

  static async deleteOrderAdmin(id: number) {
    return apiClient.delete(`/admin/orders/${id}`);
  }

  // Kiosk endpoints (for viewing)
  static async getOrderByCode(code: string) {
    return apiClient.get<CustomerOrder>(`/kiosk/orders/${code}`);
  }
}
