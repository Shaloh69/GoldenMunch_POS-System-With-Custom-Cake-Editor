import type { TaxRule, CreateTaxRuleRequest } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class TaxService {
  static async getTaxRules(params?: any) {
    return apiClient.get<TaxRule[]>("/admin/tax-rules", { params });
  }

  static async getTaxRuleById(id: number) {
    return apiClient.get<TaxRule>(`/admin/tax-rules/${id}`);
  }

  static async createTaxRule(data: CreateTaxRuleRequest) {
    return apiClient.post<TaxRule>("/admin/tax-rules", data);
  }

  static async updateTaxRule(id: number, data: Partial<CreateTaxRuleRequest>) {
    return apiClient.put<TaxRule>(`/admin/tax-rules/${id}`, data);
  }
}
