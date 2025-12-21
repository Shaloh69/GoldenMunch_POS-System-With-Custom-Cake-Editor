import type {
  InventoryAlert,
  InventoryTransaction,
  StockAdjustmentRequest,
  AdjustmentReason,
} from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class InventoryService {
  static async getAlerts(params?: any) {
    return apiClient.get<InventoryAlert[]>("/admin/inventory/alerts", {
      params,
    });
  }

  static async getLowStockAlerts() {
    return apiClient.get<InventoryAlert[]>("/admin/inventory/alerts", {
      params: { is_acknowledged: false },
    });
  }

  static async acknowledgeAlert(id: number) {
    return apiClient.patch(`/admin/inventory/alerts/${id}/acknowledge`);
  }

  static async adjustStock(data: StockAdjustmentRequest) {
    return apiClient.post("/admin/inventory/adjust", data);
  }

  static async getAdjustmentReasons() {
    return apiClient.get<AdjustmentReason[]>("/admin/inventory/reasons");
  }

  static async createAdjustmentReason(data: {
    reason_name: string;
    description?: string;
  }) {
    return apiClient.post("/admin/inventory/reasons", data);
  }

  static async getTransactions(menu_item_id?: number) {
    return apiClient.get<InventoryTransaction[]>(
      "/admin/inventory/transactions",
      {
        params: { menu_item_id },
      },
    );
  }
}
