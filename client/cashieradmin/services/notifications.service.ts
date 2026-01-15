import { apiClient } from "../lib/api-client";

export interface Notification {
  notification_id: string; // Composite: type-id
  type: 'custom_cake_message' | 'low_stock' | 'new_order' | 'stock_update' | 'custom_cake_status';
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date | string;
  entity_id: number; // ID of the related entity (request_id, order_id, item_id)
  entity_type: string; // 'custom_cake_request', 'order', 'menu_item'
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: any;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

export interface UnreadCountResponse {
  unread_count: number;
  breakdown: {
    custom_cake_messages: number;
    pending_requests: number;
    low_stock: number;
    pending_orders: number;
  };
}

export class NotificationsService {
  /**
   * Get all notifications
   */
  static async getAllNotifications(params?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
  }) {
    return apiClient.get<NotificationsResponse>("/notifications", {
      params,
    });
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount() {
    return apiClient.get<UnreadCountResponse>("/notifications/unread-count");
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return apiClient.put(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds: string[]) {
    return Promise.all(notificationIds.map((id) => this.markAsRead(id)));
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'custom_cake_message':
        return '💬';
      case 'custom_cake_status':
        return '🎂';
      case 'low_stock':
        return '📦';
      case 'stock_update':
        return '📊';
      case 'new_order':
        return '🛒';
      default:
        return '🔔';
    }
  }

  /**
   * Get notification color based on priority
   */
  static getNotificationColor(priority: Notification['priority']): string {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  }

  /**
   * Format notification time
   */
  static formatTime(date: Date | string): string {
    const notificationDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - notificationDate.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return notificationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
