import type { Customer, CreateCustomerRequest } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class CustomerService {
  static async getCustomers(params?: any) {
    return apiClient.get<Customer[]>("/admin/customers", { params });
  }

  static async getCustomerById(id: number) {
    return apiClient.get<Customer>(`/admin/customers/${id}`);
  }

  static async createCustomer(data: CreateCustomerRequest) {
    return apiClient.post<Customer>("/admin/customers", data);
  }

  static async updateCustomer(
    id: number,
    data: Partial<CreateCustomerRequest>,
  ) {
    return apiClient.put<Customer>(`/admin/customers/${id}`, data);
  }
}
