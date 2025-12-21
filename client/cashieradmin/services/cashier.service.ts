import type { Cashier, CreateCashierRequest } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class CashierService {
  static async getCashiers(params?: any) {
    return apiClient.get<Cashier[]>("/admin/cashiers", { params });
  }

  static async getCashierById(id: number) {
    return apiClient.get<Cashier>(`/admin/cashiers/${id}`);
  }

  static async createCashier(data: CreateCashierRequest) {
    return apiClient.post<Cashier>("/admin/cashiers", data);
  }

  static async updateCashier(id: number, data: Partial<CreateCashierRequest>) {
    return apiClient.put<Cashier>(`/admin/cashiers/${id}`, data);
  }

  static async deleteCashier(id: number) {
    return apiClient.delete(`/admin/cashiers/${id}`);
  }
}
