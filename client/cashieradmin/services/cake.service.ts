import type { CakeFlavor, CakeSize, CustomCakeTheme } from "@/types/api";

import { apiClient } from "@/lib/api-client";

export class CakeService {
  // Flavors
  static async getFlavors() {
    return apiClient.get<CakeFlavor[]>("/admin/cake/flavors");
  }

  static async createFlavor(data: {
    flavor_name: string;
    description?: string;
    additional_cost: number;
    display_order?: number;
    is_available?: boolean;
  }) {
    return apiClient.post<CakeFlavor>("/admin/cake/flavors", data);
  }

  static async updateFlavor(
    id: number,
    data: Partial<{
      flavor_name: string;
      description?: string;
      additional_cost: number;
      display_order?: number;
      is_available?: boolean;
    }>,
  ) {
    return apiClient.put<CakeFlavor>(`/admin/cake/flavors/${id}`, data);
  }

  // Sizes
  static async getSizes() {
    return apiClient.get<CakeSize[]>("/admin/cake/sizes");
  }

  static async createSize(data: {
    size_name: string;
    serves_people: number;
    diameter_inches: number;
    size_multiplier: number;
    display_order?: number;
    is_available?: boolean;
  }) {
    return apiClient.post<CakeSize>("/admin/cake/sizes", data);
  }

  static async updateSize(
    id: number,
    data: Partial<{
      size_name: string;
      serves_people: number;
      diameter_inches: number;
      size_multiplier: number;
      display_order?: number;
      is_available?: boolean;
    }>,
  ) {
    return apiClient.put<CakeSize>(`/admin/cake/sizes/${id}`, data);
  }

  // Themes
  static async getThemes() {
    return apiClient.get<CustomCakeTheme[]>("/admin/cake/themes");
  }

  static async createTheme(
    data: {
      theme_name: string;
      description?: string;
      base_additional_cost: number;
      preparation_days: number;
      display_order?: number;
      is_available?: boolean;
    },
    imageFile?: File,
  ) {
    if (imageFile) {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      formData.append("image", imageFile);

      return apiClient.postFormData<CustomCakeTheme>(
        "/admin/cake/themes",
        formData,
      );
    }

    return apiClient.post<CustomCakeTheme>("/admin/cake/themes", data);
  }

  static async updateTheme(
    id: number,
    data: Partial<{
      theme_name: string;
      description?: string;
      base_additional_cost: number;
      preparation_days: number;
      display_order?: number;
      is_available?: boolean;
    }>,
    imageFile?: File,
  ) {
    if (imageFile) {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      formData.append("image", imageFile);

      return apiClient.postFormData<CustomCakeTheme>(
        `/admin/cake/themes/${id}`,
        formData,
      );
    }

    return apiClient.put<CustomCakeTheme>(`/admin/cake/themes/${id}`, data);
  }
}
