import apiClient from '@/config/api';
import type {
  MenuItem,
  MenuItemWithCustomization,
  Category,
  PromotionRule,
  ApiResponse,
  MenuQueryParams,
  CapacityCheckParams,
  CapacityCheckResult
} from '@/types/api';

/**
 * Menu Service - Handles all menu-related API calls
 */
export class MenuService {
  /**
   * Get all menu items with optional filters
   */
  static async getMenuItems(params?: MenuQueryParams): Promise<MenuItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<MenuItem[]>>('/kiosk/menu', {
        params: {
          ...params,
          is_featured: params?.is_featured ? 'true' : undefined,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  /**
   * Get menu item details with customization options
   */
  static async getItemDetails(id: number): Promise<MenuItemWithCustomization> {
    try {
      const response = await apiClient.get<ApiResponse<MenuItemWithCustomization>>(
        `/kiosk/menu/${id}`
      );
      if (!response.data.data) {
        throw new Error('Item not found');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching item details:', error);
      throw error;
    }
  }

  /**
   * Get all active categories
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/kiosk/categories');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get active promotions
   */
  static async getActivePromotions(): Promise<PromotionRule[]> {
    try {
      const response = await apiClient.get<ApiResponse<PromotionRule[]>>('/kiosk/promotions');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  }

  /**
   * Check custom cake capacity for a given date and complexity
   */
  static async checkCapacity(params: CapacityCheckParams): Promise<CapacityCheckResult> {
    try {
      const response = await apiClient.get<ApiResponse<CapacityCheckResult>>(
        '/kiosk/capacity/check',
        { params }
      );
      if (!response.data.data) {
        throw new Error('Unable to check capacity');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error checking capacity:', error);
      throw error;
    }
  }
}

export default MenuService;
