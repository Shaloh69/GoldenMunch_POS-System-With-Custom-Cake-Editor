import { apiClient } from '@/lib/api-client';
import type { CustomCakeRequest } from '@/types/api';

/**
 * Custom Cake Request Details (from stored procedure)
 */
export interface CustomCakeRequestDetails {
  request: CustomCakeRequest & {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    submitted_at?: string;
    reviewed_at?: string;
    reviewed_by?: number;
    reviewer_name?: string;
  };
  layers: Array<{
    layer_number: number;
    flavor_name?: string;
    size_name?: string;
    diameter_cm?: number;
  }>;
  images: Array<{
    image_id: number;
    image_url: string;
    image_type: string;
    view_angle: string;
    uploaded_at: string;
  }>;
}

/**
 * Approve Request Data
 */
export interface ApproveCustomCakeData {
  approved_price: number;
  preparation_days: number;
  scheduled_pickup_date: string;
  scheduled_pickup_time?: string;
  admin_notes?: string;
}

/**
 * Reject Request Data
 */
export interface RejectCustomCakeData {
  rejection_reason: string;
  admin_notes?: string;
}

/**
 * Custom Cake Request Service - Admin operations
 */
export class CustomCakeRequestService {
  /**
   * Get all pending custom cake requests
   */
  static async getPendingRequests(): Promise<CustomCakeRequest[]> {
    const response = await apiClient.get<CustomCakeRequest[]>('/admin/custom-cakes/pending');
    return response.data || [];
  }

  /**
   * Get detailed information about a custom cake request
   */
  static async getRequestDetails(requestId: number): Promise<CustomCakeRequestDetails> {
    const response = await apiClient.get<CustomCakeRequestDetails>(`/admin/custom-cakes/${requestId}`);
    return response.data as CustomCakeRequestDetails;
  }

  /**
   * Approve a custom cake request
   */
  static async approveRequest(
    requestId: number,
    data: ApproveCustomCakeData
  ): Promise<void> {
    await apiClient.post<void>(`/admin/custom-cakes/${requestId}/approve`, data);
  }

  /**
   * Reject a custom cake request
   */
  static async rejectRequest(
    requestId: number,
    data: RejectCustomCakeData
  ): Promise<void> {
    await apiClient.post<void>(`/admin/custom-cakes/${requestId}/reject`, data);
  }

  /**
   * Calculate estimated price (helper for frontend)
   */
  static calculateEstimatedPrice(request: Partial<CustomCakeRequest>): number {
    const BASE_PRICE = 500;
    const LAYER_PRICE = 150;
    const THEME_COST = 200; // average
    const DECORATION_COST = 100;

    const numLayers = request.num_layers || 1;
    const hasTheme = !!request.theme_id;
    const hasDecorations = request.decorations_3d && Array.isArray(request.decorations_3d) && request.decorations_3d.length > 0;

    let total = BASE_PRICE;
    total += (numLayers - 1) * LAYER_PRICE;
    if (hasTheme) total += THEME_COST;
    if (hasDecorations) total += DECORATION_COST;

    return total;
  }

  /**
   * Format price to Philippine Peso
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  }

  /**
   * Get status badge color
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'draft':
        return 'default';
      case 'pending_review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  }

  /**
   * Get status label
   */
  static getStatusLabel(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export default CustomCakeRequestService;
