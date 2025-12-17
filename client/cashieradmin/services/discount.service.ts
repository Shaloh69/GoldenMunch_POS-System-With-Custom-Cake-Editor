import { apiClient } from '@/lib/api-client';
import type { CustomerDiscountType } from '@/types/api';

export interface CreateDiscountTypeRequest {
  name: string;
  description?: string;
  discount_percentage: number;
  requires_id?: boolean;
  is_active?: boolean;
}

export interface UpdateDiscountTypeRequest {
  name?: string;
  description?: string;
  discount_percentage?: number;
  requires_id?: boolean;
  is_active?: boolean;
}

export interface DiscountStats {
  discount_type_id: number;
  name: string;
  discount_percentage: number;
  usage_count: number;
  total_discount_amount: number;
  avg_discount_amount: number;
}

export class DiscountService {
  // Admin endpoints
  static async getDiscountTypes(params?: { include_inactive?: boolean }) {
    return apiClient.get<CustomerDiscountType[]>('/admin/discounts', { params });
  }

  static async getDiscountTypeById(id: number) {
    return apiClient.get<CustomerDiscountType>(`/admin/discounts/${id}`);
  }

  static async createDiscountType(data: CreateDiscountTypeRequest) {
    return apiClient.post<CustomerDiscountType>('/admin/discounts', data);
  }

  static async updateDiscountType(id: number, data: UpdateDiscountTypeRequest) {
    return apiClient.put<CustomerDiscountType>(`/admin/discounts/${id}`, data);
  }

  static async deleteDiscountType(id: number) {
    return apiClient.delete(`/admin/discounts/${id}`);
  }

  static async getDiscountStats(params?: { start_date?: string; end_date?: string }) {
    return apiClient.get<DiscountStats[]>('/admin/discounts/stats', { params });
  }

  // Cashier endpoints
  static async getActiveDiscountTypes() {
    return apiClient.get<CustomerDiscountType[]>('/cashier/discounts');
  }
}
