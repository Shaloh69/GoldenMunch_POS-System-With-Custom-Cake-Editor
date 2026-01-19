"use client";

import useSWR from 'swr';
import { useCallback } from 'react';
import { useSSE } from './useSSE';
import { NotificationsService, Notification, NotificationsResponse, UnreadCountResponse } from '@/services/notifications.service';

// IMPORTANT: All server routes are mounted at /api prefix
const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:5000/api';

/**
 * Get auth token from localStorage
 */
const getToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('auth_token') || undefined;
};

/**
 * Hook to fetch and manage all notifications
 */
export function useNotifications(params?: {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    ['notifications', params],
    async () => {
      const response = await NotificationsService.getAllNotifications(params);
      return response.data || { notifications: [], total: 0, unread_count: 0, has_more: false };
    },
    {
      refreshInterval: 0, // Disable polling, use SSE instead
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  // Listen for SSE events that should trigger notification refresh
  useSSE({
    url: `${API_URL}/sse/orders`,
    token: getToken(),
    enabled: true,
    events: {
      'order.created': () => mutate(),
      'order.status_changed': () => mutate(),
    },
  });

  useSSE({
    url: `${API_URL}/sse/custom-cakes`,
    token: getToken(),
    enabled: true,
    events: {
      'custom_cake.submitted': () => mutate(),
      'custom_cake.message_received': () => mutate(),
      'custom_cake.approved': () => mutate(),
      'custom_cake.rejected': () => mutate(),
    },
  });

  useSSE({
    url: `${API_URL}/sse/menu`,
    enabled: true,
    events: {
      'menu.item.stock_changed': () => mutate(),
      'menu.item.updated': () => mutate(),
    },
  });

  /**
   * Mark notification as read
   */
  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await NotificationsService.markAsRead(notificationId);
      mutate(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  /**
   * Mark multiple notifications as read
   */
  const markMultipleAsRead = async (notificationIds: string[]): Promise<void> => {
    try {
      await NotificationsService.markMultipleAsRead(notificationIds);
      mutate(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async (): Promise<void> => {
    if (!data?.notifications) return;

    const unreadIds = data.notifications
      .filter((n) => !n.is_read)
      .map((n) => n.notification_id);

    if (unreadIds.length > 0) {
      await markMultipleAsRead(unreadIds);
    }
  };

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unreadCount: data?.unread_count || 0,
    hasMore: data?.has_more || false,
    error,
    isLoading,
    mutate,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
  };
}

/**
 * Hook to get unread notification count only
 */
export function useUnreadNotificationCount() {
  const { data, error, isLoading, mutate } = useSWR<UnreadCountResponse>(
    'notifications-unread-count',
    async () => {
      const response = await NotificationsService.getUnreadCount();
      return response.data || { unread_count: 0, breakdown: { custom_cake_messages: 0, pending_requests: 0, low_stock: 0, pending_orders: 0 } };
    },
    {
      refreshInterval: 300000, // Reduced polling: 5 minutes (was 30s) - SSE handles real-time updates
      revalidateOnFocus: true,
    }
  );

  // Listen for SSE events that should trigger count update
  useSSE({
    url: `${API_URL}/sse/orders`,
    token: getToken(),
    enabled: true,
    events: {
      'order.created': () => mutate(),
    },
  });

  useSSE({
    url: `${API_URL}/sse/custom-cakes`,
    token: getToken(),
    enabled: true,
    events: {
      'custom_cake.submitted': () => mutate(),
      'custom_cake.message_received': () => mutate(),
      'custom_cake.messages_read': () => mutate(),
    },
  });

  useSSE({
    url: `${API_URL}/sse/menu`,
    enabled: true,
    events: {
      'menu.item.stock_changed': () => mutate(),
    },
  });

  return {
    unreadCount: data?.unread_count || 0,
    breakdown: data?.breakdown || { custom_cake_messages: 0, pending_requests: 0, low_stock: 0, pending_orders: 0 },
    error,
    isLoading,
    mutate,
  };
}
