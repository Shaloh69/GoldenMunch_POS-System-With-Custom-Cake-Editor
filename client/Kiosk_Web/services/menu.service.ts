import apiClient from "@/config/api";
import type {
  MenuItem,
  MenuItemWithCustomization,
  Category,
  MenuItemType,
  UnitOfMeasure,
  PromotionRule,
  ApiResponse,
  MenuQueryParams,
  CapacityCheckParams,
  CapacityCheckResult,
} from "@/types/api";

/**
 * Menu Service - Handles all menu-related API calls
 */
export class MenuService {
  /**
   * Get all menu items with optional filters
   */
  static async getMenuItems(params?: MenuQueryParams): Promise<MenuItem[]> {
    try {
      console.log("📋 MenuService.getMenuItems() called", {
        params,
        timestamp: new Date().toISOString(),
      });

      const response = await apiClient.get<ApiResponse<MenuItem[]>>(
        "/kiosk/menu",
        {
          params: {
            ...params,
            is_featured: params?.is_featured ? "true" : undefined,
          },
        },
      );

      const items = response.data.data || [];
      console.log("✅ MenuService.getMenuItems() received", {
        itemCount: items.length,
        items: items.map((item) => ({
          id: item.menu_item_id,
          name: item.name,
          price: item.current_price,
        })),
        timestamp: new Date().toISOString(),
      });

      return items;
    } catch (error) {
      console.error("❌ MenuService.getMenuItems() error:", error);
      throw error;
    }
  }

  /**
   * Get menu item details with customization options
   */
  static async getItemDetails(id: number): Promise<MenuItemWithCustomization> {
    try {
      const response = await apiClient.get<
        ApiResponse<MenuItemWithCustomization>
      >(`/kiosk/menu/${id}`);
      if (!response.data.data) {
        throw new Error("Item not found");
      }
      return response.data.data;
    } catch (error) {
      console.error("Error fetching item details:", error);
      throw error;
    }
  }

  /**
   * Get all active categories
   */
  static async getCategories(): Promise<Category[]> {
    try {
      console.log("📂 MenuService.getCategories() called", {
        timestamp: new Date().toISOString(),
      });

      const response = await apiClient.get<ApiResponse<Category[]>>(
        "/kiosk/categories"
      );

      const categories = response.data.data || [];
      console.log("✅ MenuService.getCategories() received", {
        categoryCount: categories.length,
        categories: categories.map((cat) => ({
          id: cat.category_id,
          name: cat.name,
        })),
        timestamp: new Date().toISOString(),
      });

      return categories;
    } catch (error) {
      console.error("❌ MenuService.getCategories() error:", error);
      throw error;
    }
  }

  /**
   * Get all active item types
   */
  static async getItemTypes(): Promise<MenuItemType[]> {
    try {
      const response = await apiClient.get<ApiResponse<MenuItemType[]>>(
        "/admin/menu/item-types"
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching item types:", error);
      throw error;
    }
  }

  /**
   * Get all active units of measure
   */
  static async getUnits(): Promise<UnitOfMeasure[]> {
    try {
      const response = await apiClient.get<ApiResponse<UnitOfMeasure[]>>(
        "/admin/menu/units"
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching units:", error);
      throw error;
    }
  }

  /**
   * Get active promotions
   */
  static async getActivePromotions(): Promise<PromotionRule[]> {
    try {
      const response = await apiClient.get<ApiResponse<PromotionRule[]>>(
        "/kiosk/promotions"
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching promotions:", error);
      throw error;
    }
  }

  /**
   * Check custom cake capacity for a given date and complexity
   */
  static async checkCapacity(
    params: CapacityCheckParams,
  ): Promise<CapacityCheckResult> {
    try {
      const response = await apiClient.get<ApiResponse<CapacityCheckResult>>(
        "/kiosk/capacity/check",
        { params },
      );
      if (!response.data.data) {
        throw new Error("Unable to check capacity");
      }
      return response.data.data;
    } catch (error) {
      console.error("Error checking capacity:", error);
      throw error;
    }
  }
}

export default MenuService;
