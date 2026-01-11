"use client";

import useSWR from 'swr';
import { useSSE } from './useSSE';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Message {
  notification_id: number;
  request_id: number;
  notification_type: string;
  sender_type: 'customer' | 'admin' | 'system';
  sender_name: string;
  recipient_email: string;
  subject: string;
  message_body: string;
  status: 'pending' | 'sent' | 'failed';
  is_read: boolean;
  sent_at: string;
  read_at: string | null;
  parent_notification_id: number | null;
  customer_name?: string;
  customer_email?: string;
  request_status?: string;
}

export interface MessagesResponse {
  messages: Message[];
  request: any;
  unread_count: number;
}

/**
 * Hook to fetch and manage messages for a custom cake request
 */
export function useMessages(requestId: number | string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
    requestId ? `messages-${requestId}` : null,
    async () => {
      if (!requestId) return null;

      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/api/admin/custom-cakes/${requestId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data?.data || { messages: [], request: null, unread_count: 0 };
    },
    {
      refreshInterval: 0, // Disable polling, use SSE instead
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  // Listen for SSE events
  useSSE({
    url: `${API_URL}/api/sse/custom-cakes`,
    enabled: !!requestId,
    events: {
      'custom_cake.message_received': (eventData: any) => {
        // Only update if this message is for our request
        if (eventData.request_id === parseInt(requestId as string, 10)) {
          mutate();
        }
      },
      'custom_cake.messages_read': (eventData: any) => {
        if (eventData.request_id === parseInt(requestId as string, 10)) {
          mutate();
        }
      },
    },
  });

  /**
   * Send a message (admin reply)
   */
  const sendMessage = async (
    messageBody: string,
    subject?: string,
    parentNotificationId?: number
  ): Promise<Message | null> => {
    if (!requestId) return null;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/api/admin/custom-cakes/${requestId}/messages`,
        {
          message_body: messageBody,
          subject,
          parent_notification_id: parentNotificationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Optimistically update local data
      mutate();

      return response.data?.data || null;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  /**
   * Mark messages as read
   */
  const markAsRead = async (notificationIds: number[]): Promise<void> => {
    if (!requestId || notificationIds.length === 0) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_URL}/api/admin/custom-cakes/${requestId}/messages/mark-read`,
        { notification_ids: notificationIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local data
      mutate();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  };

  return {
    messages: data?.messages || [],
    request: data?.request || null,
    unreadCount: data?.unread_count || 0,
    error,
    isLoading,
    mutate,
    sendMessage,
    markAsRead,
  };
}

/**
 * Hook to get total unread message count across all requests
 */
export function useUnreadMessageCount() {
  const { data, error, isLoading, mutate } = useSWR<number>(
    'unread-message-count',
    async () => {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/api/admin/custom-cakes/messages/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data?.data?.unread_count || 0;
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  // Listen for new messages
  useSSE({
    url: `${API_URL}/api/sse/custom-cakes`,
    enabled: true,
    events: {
      'custom_cake.message_received': () => {
        mutate();
      },
      'custom_cake.messages_read': () => {
        mutate();
      },
    },
  });

  return {
    unreadCount: data || 0,
    error,
    isLoading,
    mutate,
  };
}
