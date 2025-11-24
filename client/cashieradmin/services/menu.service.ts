import { apiClient } from '@/lib/api-client';
import type {
  MenuItem,
  Category,
  MenuItemPrice,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  CreateCategoryRequest
} from '@/types/api';

export class MenuService {
  // Public/Kiosk endpoints
  static async getMenuItems(params?: any) {
    return apiClient.get<MenuItem[]>('/kiosk/menu', { params });
  }

  static async getMenuItemById(id: number) {
    return apiClient.get<MenuItem>(`/kiosk/menu/${id}`);
  }

  static async getCategories() {
    return apiClient.get<Category[]>('/kiosk/categories');
  }

  // Admin endpoints
  static async createMenuItem(data: CreateMenuItemRequest, imageFile?: File) {
    if (imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle booleans and numbers properly
          if (typeof value === 'boolean') {
            formData.append(key, value ? '1' : '0');
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append('image', imageFile);
      return apiClient.postFormData<MenuItem>('/admin/menu', formData);
    }
    return apiClient.post<MenuItem>('/admin/menu', data);
  }

  static async updateMenuItem(id: number, data: UpdateMenuItemRequest, imageFile?: File) {
    if (imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle booleans and numbers properly
          if (typeof value === 'boolean') {
            formData.append(key, value ? '1' : '0');
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append('image', imageFile);
      return apiClient.postFormData<MenuItem>(`/admin/menu/${id}`, formData);
    }
    return apiClient.put<MenuItem>(`/admin/menu/${id}`, data);
  }

  static async deleteMenuItem(id: number) {
    return apiClient.delete(`/admin/menu/${id}`);
  }

  static async addMenuItemPrice(data: {
    menu_item_id: number;
    unit_price: number;
    valid_from: string;
    valid_until: string;
    price_type: string;
    is_active?: boolean;
  }) {
    return apiClient.post<MenuItemPrice>('/admin/menu/prices', data);
  }

  static async createCategory(data: CreateCategoryRequest) {
    return apiClient.post<Category>('/admin/categories', data);
  }

  static async updateCategory(id: number, data: Partial<CreateCategoryRequest>) {
    return apiClient.put<Category>(`/admin/categories/${id}`, data);
  }

  static async assignItemToCategory(data: {
    menu_item_id: number;
    category_id: number;
    display_order?: number;
  }) {
    return apiClient.post('/admin/categories/assign', data);
  }
}
