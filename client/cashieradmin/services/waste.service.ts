import type { WasteTracking, CreateWasteRequest } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class WasteService {
  static async createWaste(data: CreateWasteRequest) {
    return apiClient.post<WasteTracking>("/cashier/waste", data);
  }

  static async getWaste(params?: any) {
    return apiClient.get<WasteTracking[]>("/cashier/waste", { params });
  }
}
