import type { Supplier, CreateSupplierRequest } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class SupplierService {
  static async getSuppliers(params?: any) {
    return apiClient.get<Supplier[]>("/admin/suppliers", { params });
  }

  static async getSupplierById(id: number) {
    return apiClient.get<Supplier>(`/admin/suppliers/${id}`);
  }

  static async createSupplier(data: CreateSupplierRequest) {
    return apiClient.post<Supplier>("/admin/suppliers", data);
  }

  static async updateSupplier(
    id: number,
    data: Partial<CreateSupplierRequest>,
  ) {
    return apiClient.put<Supplier>(`/admin/suppliers/${id}`, data);
  }

  static async deleteSupplier(id: number) {
    return apiClient.delete(`/admin/suppliers/${id}`);
  }
}
