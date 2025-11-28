import apiClient from '@/config/api';
import type { ApiResponse } from '@/types/api';

/**
 * Custom Cake Session Interface (New Comprehensive API)
 */
export interface CustomCakeSessionResponse {
  sessionId: string;
  qrCodeUrl: string;
  editorUrl: string;
  expiresIn: number;
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
   * Generate a new QR code session for custom cake design
   * Uses the new comprehensive API endpoint
   */
  static async generateQRSession(kioskId?: string): Promise<CustomCakeSessionResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CustomCakeSessionResponse>>(
        '/kiosk/custom-cake/generate-qr',
        {
          kiosk_id: kioskId || 'KIOSK-DEFAULT',
        }
      );

      if (!response.data.data) {
        throw new Error('Failed to generate QR code session');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error generating QR session:', error);
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
