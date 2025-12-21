import type { PromotionRule, CreatePromotionRequest } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class PromotionService {
  static async getPromotions(params?: any) {
    return apiClient.get<PromotionRule[]>("/admin/promotions", { params });
  }

  static async getPromotionById(id: number) {
    return apiClient.get<PromotionRule>(`/admin/promotions/${id}`);
  }

  static async createPromotion(data: CreatePromotionRequest) {
    return apiClient.post<PromotionRule>("/admin/promotions", data);
  }

  static async updatePromotion(
    id: number,
    data: Partial<CreatePromotionRequest>,
  ) {
    return apiClient.put<PromotionRule>(`/admin/promotions/${id}`, data);
  }

  static async deletePromotion(id: number) {
    return apiClient.delete(`/admin/promotions/${id}`);
  }

  static async assignItems(id: number, item_ids: number[]) {
    return apiClient.post(`/admin/promotions/${id}/items`, { item_ids });
  }

  static async assignCategories(id: number, category_ids: number[]) {
    return apiClient.post(`/admin/promotions/${id}/categories`, {
      category_ids,
    });
  }

  static async getAssignments(id: number) {
    return apiClient.get(`/admin/promotions/${id}/assignments`);
  }

  static async getUsageLog(id: number) {
    return apiClient.get(`/admin/promotions/${id}/usage`);
  }

  // Public endpoint
  static async getActivePromotions() {
    return apiClient.get<PromotionRule[]>("/kiosk/promotions");
  }
}
