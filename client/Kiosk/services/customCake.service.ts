import apiClient from '@/config/api';
import type { ApiResponse } from '@/types/api';

/**
 * Custom Cake Session Interface
 */
export interface CustomCakeSessionResponse {
  sessionId: string;
  customizationUrl: string;
  qrCodeDataUrl: string;
  expiresAt: string;
}

export interface CustomCakeSessionStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  customizationData?: {
    flavor_id?: number;
    size_id?: number;
    theme_id?: number;
    frosting_color?: string;
    frosting_type?: string;
    decoration_details?: string;
    cake_text?: string;
    special_instructions?: string;
    design_complexity?: string;
  };
}

/**
 * Custom Cake Service - Handles custom cake session management
 */
export class CustomCakeService {
  /**
   * Create a new custom cake session
   */
  static async createSession(
    kioskSessionId: string,
    menuItemId?: number
  ): Promise<CustomCakeSessionResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CustomCakeSessionResponse>>(
        '/kiosk/custom-cake/session',
        {
          kiosk_session_id: kioskSessionId,
          menu_item_id: menuItemId,
        }
      );

      if (!response.data.data) {
        throw new Error('Failed to create custom cake session');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error creating custom cake session:', error);
      throw error;
    }
  }

  /**
   * Poll session status to check if customization is complete
   */
  static async pollSessionStatus(sessionId: string): Promise<CustomCakeSessionStatus> {
    try {
      const response = await apiClient.get<ApiResponse<CustomCakeSessionStatus>>(
        `/kiosk/custom-cake/session/${sessionId}/poll`
      );

      if (!response.data.data) {
        throw new Error('Failed to poll session status');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error polling session status:', error);
      throw error;
    }
  }

  /**
   * Cancel a session
   */
  static async cancelSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/kiosk/custom-cake/session/${sessionId}`);
    } catch (error) {
      console.error('Error canceling session:', error);
      throw error;
    }
  }

  /**
   * Complete customization (called from mobile)
   */
  static async completeCustomization(
    sessionId: string,
    customizationData: CustomCakeSessionStatus['customizationData']
  ): Promise<void> {
    try {
      // First update the session
      await apiClient.put(`/kiosk/custom-cake/session/${sessionId}`, customizationData);

      // Then mark it as complete
      await apiClient.post(`/kiosk/custom-cake/session/${sessionId}/complete`);
    } catch (error) {
      console.error('Error completing customization:', error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  static async getSession(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/kiosk/custom-cake/session/${sessionId}`
      );

      if (!response.data.data) {
        throw new Error('Session not found');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }
}

export default CustomCakeService;
