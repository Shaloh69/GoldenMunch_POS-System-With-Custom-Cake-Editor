import type { RefundRequest, CreateRefundRequest } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class RefundService {
  // Cashier endpoints
  static async createRefund(data: CreateRefundRequest) {
    return apiClient.post<RefundRequest>("/cashier/refund", data);
  }

  static async getRefunds(params?: any) {
    return apiClient.get<RefundRequest[]>("/cashier/refund", { params });
  }

  // Admin endpoints
  static async getAllRefunds(params?: any) {
    return apiClient.get<RefundRequest[]>("/admin/refund", { params });
  }

  static async getRefundById(id: number) {
    return apiClient.get<RefundRequest>(`/admin/refund/${id}`);
  }

  static async approveRefund(id: number) {
    return apiClient.post(`/admin/refund/${id}/approve`);
  }

  static async rejectRefund(id: number, reason: string) {
    return apiClient.post(`/admin/refund/${id}/reject`, { notes: reason });
  }

  static async completeRefund(
    id: number,
    data: {
      refund_method: string;
      refund_reference?: string;
    },
  ) {
    return apiClient.post(`/admin/refund/${id}/complete`, data);
  }
}
