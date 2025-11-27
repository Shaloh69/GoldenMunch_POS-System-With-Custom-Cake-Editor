import { apiClient } from '@/lib/api-client';
import type { CustomerFeedback, FeedbackStats } from '@/types/api';

export class FeedbackService {
  // Cashier endpoints
  static async submitFeedback(data: {
    order_id?: number;
    customer_id?: number;
    rating: number;
    service_rating?: number;
    food_rating?: number;
    cleanliness_rating?: number;
    feedback_text?: string;
    is_anonymous?: boolean;
  }) {
    return apiClient.post<CustomerFeedback>('/cashier/feedback', data);
  }

  // Admin endpoints
  static async getAllFeedback(params?: any) {
    return apiClient.get<CustomerFeedback[]>('/admin/feedback', { params });
  }

  static async getFeedbackStats() {
    return apiClient.get<FeedbackStats>('/admin/feedback/stats');
  }

  static async respondToFeedback(id: number, response: string) {
    return apiClient.post(`/admin/feedback/${id}/respond`, { admin_response: response });
  }
}
