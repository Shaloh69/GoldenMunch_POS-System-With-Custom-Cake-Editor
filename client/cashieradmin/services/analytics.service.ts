import type { SalesAnalytics, DailyStats } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class AnalyticsService {
  static async getSalesAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }) {
    return apiClient.get<SalesAnalytics>("/admin/analytics/sales", { params });
  }

  static async getTrendingItems(params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) {
    return apiClient.get("/admin/analytics/trending", { params });
  }

  static async getWasteReport(params?: {
    start_date?: string;
    end_date?: string;
  }) {
    return apiClient.get("/admin/analytics/waste", { params });
  }

  static async recalculatePopularity() {
    return apiClient.post("/admin/analytics/popularity/recalculate");
  }

  static async getDailyStats(params?: {
    start_date?: string;
    end_date?: string;
    menu_item_id?: number;
  }) {
    return apiClient.get<DailyStats[]>("/admin/stats/daily", { params });
  }

  static async getPopularityHistory(menu_item_id: number) {
    return apiClient.get(`/admin/stats/popularity-history`, {
      params: { menu_item_id },
    });
  }
}
