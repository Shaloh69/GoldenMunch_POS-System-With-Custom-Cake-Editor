import apiClient from '@/config/api';
import type { ApiResponse } from '@/types/api';

/**
 * Custom Cake Session Interface (New Comprehensive API)
 */
export interface CustomCakeSessionResponse {
  sessionToken: string;
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
      console.log('🔵 [Kiosk] Generating QR session...', { kioskId });

      const response = await apiClient.post<ApiResponse<CustomCakeSessionResponse>>(
        '/kiosk/custom-cake/generate-qr',
        {
          kiosk_id: kioskId || 'KIOSK-DEFAULT',
        }
      );

      console.log('🟢 [Kiosk] QR session generated successfully:', {
        sessionToken: response.data.data?.sessionToken?.substring(0, 30) + '...',
        editorUrl: response.data.data?.editorUrl,
        expiresIn: response.data.data?.expiresIn,
      });

      if (!response.data.data) {
        throw new Error('Failed to generate QR code session');
      }

      return response.data.data;
    } catch (error) {
      console.error('🔴 [Kiosk] Error generating QR session:', error);
      throw error;
    }
  }

  /**
   * Poll session status to check if customization is complete
   */
  static async pollSessionStatus(sessionId: string): Promise<CustomCakeSessionStatus> {
    try {
      console.log('🔵 [Kiosk] Polling session status...', {
        sessionToken: sessionId.substring(0, 30) + '...',
      });

      const response = await apiClient.get<ApiResponse<CustomCakeSessionStatus>>(
        `/kiosk/custom-cake/session/${sessionId}/poll`
      );

      console.log('🟢 [Kiosk] Poll response:', {
        status: response.data.data?.status,
        hasCustomizationData: !!response.data.data?.customizationData,
      });

      if (!response.data.data) {
        throw new Error('Failed to poll session status');
      }

      return response.data.data;
    } catch (error) {
      console.error('🔴 [Kiosk] Error polling session status:', error);
      throw error;
    }
  }

  /**
   * Cancel a session
   * TODO: This still uses the old in-memory API endpoint and may not work.
   * Need to implement cancel functionality in the new database-backed API.
   */
  static async cancelSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/kiosk/custom-cake/session/${sessionId}`);
    } catch (error) {
      console.error('Error canceling session:', error);
      // Fail silently as this uses deprecated endpoint
      // throw error;
    }
  }

  /**
   * Complete customization (called from mobile)
   * TODO: This still uses the old in-memory API endpoints and may not work.
   * The new workflow should use /custom-cake/save-draft and /custom-cake/submit endpoints.
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
   * Validate session token (called from mobile editor)
   * Returns session validation info
   */
  static async validateSession(sessionToken: string): Promise<any> {
    try {
      console.log('🔵 [Mobile] Validating session...', {
        sessionToken: sessionToken.substring(0, 30) + '...',
      });

      const response = await apiClient.get<ApiResponse<any>>(
        `/custom-cake/session/${sessionToken}`
      );

      console.log('🟢 [Mobile] Session validated:', {
        status: response.data.data?.status,
        minutesRemaining: response.data.data?.minutesRemaining,
      });

      if (!response.data.data) {
        throw new Error('Session not found or expired');
      }

      return response.data.data;
    } catch (error) {
      console.error('🔴 [Mobile] Error validating session:', error);
      throw error;
    }
  }

  /**
   * Get all available customization options (flavors, sizes, themes)
   * This is the correct endpoint for loading design options
   */
  static async getDesignOptions(): Promise<any> {
    try {
      console.log('🔵 [Mobile] Fetching design options...');

      const response = await apiClient.get<ApiResponse<any>>(
        '/custom-cake/options'
      );

      console.log('🟢 [Mobile] Design options loaded:', {
        flavorsCount: response.data.data?.flavors?.length || 0,
        sizesCount: response.data.data?.sizes?.length || 0,
        themesCount: response.data.data?.themes?.length || 0,
      });

      if (!response.data.data) {
        throw new Error('Failed to load design options');
      }

      return response.data.data;
    } catch (error) {
      console.error('🔴 [Mobile] Error fetching design options:', error);
      throw error;
    }
  }

  /**
   * Save draft of custom cake design (auto-save)
   */
  static async saveDraft(draftData: any): Promise<any> {
    try {
      console.log('🔵 [Mobile] Saving draft...');

      const response = await apiClient.post<ApiResponse<any>>(
        '/custom-cake/save-draft',
        draftData
      );

      console.log('🟢 [Mobile] Draft saved:', {
        requestId: response.data.data?.request_id,
      });

      return response.data.data;
    } catch (error) {
      console.error('🔴 [Mobile] Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Submit custom cake for admin review
   */
  static async submitForReview(requestId: number): Promise<any> {
    try {
      console.log('🔵 [Mobile] Submitting for review...', { requestId });

      const response = await apiClient.post<ApiResponse<any>>(
        '/custom-cake/submit',
        { request_id: requestId }
      );

      console.log('🟢 [Mobile] Submitted successfully');

      return response.data.data;
    } catch (error) {
      console.error('🔴 [Mobile] Error submitting for review:', error);
      throw error;
    }
  }

  /**
   * Get session details (DEPRECATED - use validateSession instead)
   * @deprecated Use validateSession for session validation
   */
  static async getSession(sessionId: string): Promise<any> {
    console.warn('⚠️  getSession is deprecated, use validateSession instead');
    return this.validateSession(sessionId);
  }
}

export default CustomCakeService;
