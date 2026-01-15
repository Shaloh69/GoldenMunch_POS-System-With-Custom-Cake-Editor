import type {
  MenuItem,
  Category,
  MenuItemPrice,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  CreateCategoryRequest,
  MenuItemType,
  UnitOfMeasure,
  CreateItemTypeRequest,
  CreateUnitRequest,
} from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class MenuService {
  // Admin endpoint - returns all menu items including sold_out
  static async getMenuItems(params?: any) {
    return apiClient.get<MenuItem[]>("/admin/menu", { params });
  }

  static async getMenuItemById(id: number) {
    return apiClient.get<MenuItem>(`/kiosk/menu/${id}`);
  }

  // Admin endpoint - returns all categories including inactive
  static async getCategories() {
    return apiClient.get<Category[]>("/admin/categories");
  }

  // Admin endpoints
  static async createMenuItem(data: CreateMenuItemRequest, imageFile?: File) {
    if (imageFile) {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle booleans and numbers properly
          if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else if (typeof value === "number") {
            formData.append(key, value.toString());
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append("image", imageFile);

      return apiClient.postFormData<MenuItem>("/admin/menu", formData);
    }

    return apiClient.post<MenuItem>("/admin/menu", data);
  }

  static async updateMenuItem(
    id: number,
    data: UpdateMenuItemRequest,
    imageFile?: File,
  ) {
    if (imageFile) {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle booleans and numbers properly
          if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else if (typeof value === "number") {
            formData.append(key, value.toString());
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append("image", imageFile);

      return apiClient.putFormData<MenuItem>(`/admin/menu/${id}`, formData);
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
    return apiClient.post<MenuItemPrice>("/admin/menu/prices", data);
  }

  static async createCategory(data: CreateCategoryRequest, imageFile?: File) {
    if (imageFile) {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else if (typeof value === "number") {
            formData.append(key, value.toString());
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append("image", imageFile);

      return apiClient.postFormData<Category>("/admin/categories", formData);
    }

    // Send data as-is - backend handles boolean conversion
    return apiClient.post<Category>("/admin/categories", data);
  }

  static async updateCategory(
    id: number,
    data: Partial<CreateCategoryRequest>,
    imageFile?: File,
  ) {
    if (imageFile) {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else if (typeof value === "number") {
            formData.append(key, value.toString());
          } else {
            formData.append(key, String(value));
          }
        }
      });
      formData.append("image", imageFile);

      return apiClient.putFormData<Category>(
        `/admin/categories/${id}`,
        formData,
      );
    }

    // Send data as-is - backend handles boolean conversion
    return apiClient.put<Category>(`/admin/categories/${id}`, data);
  }

  static async assignItemToCategory(data: {
    menu_item_id: number;
    category_id: number;
    display_order?: number;
  }) {
    return apiClient.post("/admin/categories/assign", data);
  }

  static async unassignItemFromCategory(data: {
    menu_item_id: number;
    category_id: number;
  }) {
    return apiClient.post("/admin/categories/unassign", data);
  }

  static async deleteCategory(id: number) {
    return apiClient.delete(`/admin/categories/${id}`);
  }

  // Item Types
  static async getItemTypes() {
    return apiClient.get<MenuItemType[]>("/admin/menu/item-types");
  }

  static async createItemType(data: CreateItemTypeRequest) {
    return apiClient.post<MenuItemType>("/admin/menu/item-types", data);
  }

  // Units of Measure
  static async getUnits() {
    return apiClient.get<UnitOfMeasure[]>("/admin/menu/units");
  }

  static async createUnit(data: CreateUnitRequest) {
    return apiClient.post<UnitOfMeasure>("/admin/menu/units", data);
  }
}
