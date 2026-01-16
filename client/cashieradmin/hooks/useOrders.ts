import useSWR from 'swr';
import { OrderService } from '@/services/order.service';
import { useSSE } from './useSSE';
import { useCallback, useEffect } from 'react';
import type { CustomerOrder } from '@/types/api';

/**
 * SWR + SSE hook for real-time orders
 * Combines SWR for data fetching with SSE for real-time updates
 */
export function useOrders(status?: string) {
  const {
    data: orders,
    error,
    isLoading,
    mutate,
  } = useSWR<CustomerOrder[]>(
    ['orders', status],
    async () => {
      const response = await OrderService.getOrders(status);
      // Extract orders from response.data.orders
      return ((response.data as any)?.orders as CustomerOrder[]) || [];
    },
    {
      refreshInterval: 0, // Disable polling, rely on SSE for updates
      revalidateOnFocus: true, // Revalidate when window regains focus
      revalidateOnReconnect: true, // Revalidate when connection is restored
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  );

  // Get token from localStorage (assuming it's stored there)
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return undefined;
    return localStorage.getItem('auth_token') || undefined;
  }, []);

  // Set up SSE connection for real-time order updates
  useSSE({
    url: `${process.env.NEXT_PUBLIC_API_URL}/sse/orders`,
    token: getToken(),
    enabled: true,
    events: {
      // When a new order is created
      'order.created': (data) => {
        console.log('[SSE] Order created:', data);
        mutate(); // Revalidate orders list
      },

      // When an order status changes
      'order.status_changed': (data) => {
        console.log('[SSE] Order status changed:', data);
        mutate(); // Revalidate orders list
      },

      // When an order is updated
      'order.updated': (data) => {
        console.log('[SSE] Order updated:', data);
        mutate(); // Revalidate orders list
      },

      // When an order is deleted
      'order.deleted': (data) => {
        console.log('[SSE] Order deleted:', data);
        mutate(); // Revalidate orders list
      },

      // When an order is marked as printed
      'order.printed': (data) => {
        console.log('[SSE] Order printed:', data);
        mutate(); // Revalidate orders list
      },

      // Connection established
      'connected': (data) => {
        console.log('[SSE] Connected to orders stream:', data);
      },
    },
    onError: (error) => {
      console.error('[SSE] Orders stream error:', error);
    },
  });

  return {
    orders: orders || [],
    error,
    isLoading,
    mutate, // Expose mutate for manual revalidation
  };
}

/**
 * SWR hook for a single order with SSE updates
 */
export function useOrder(orderId: number | null) {
  const {
    data: order,
    error,
    isLoading,
    mutate,
  } = useSWR<CustomerOrder>(
    orderId ? ['order', orderId] : null,
    async () => {
      if (!orderId) return null as any;
      const response = await OrderService.getOrderById(orderId);
      return response.data as CustomerOrder;
    },
    {
      refreshInterval: 0, // Disable polling
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  // Get token from localStorage
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return undefined;
    return localStorage.getItem('auth_token') || undefined;
  }, []);

  // Listen for updates to this specific order
  useSSE({
    url: `${process.env.NEXT_PUBLIC_API_URL}/sse/orders`,
    token: getToken(),
    enabled: orderId !== null,
    events: {
      'order.status_changed': (data) => {
        if (data.order_id === orderId) {
          console.log('[SSE] This order status changed:', data);
          mutate();
        }
      },
      'order.updated': (data) => {
        if (data.order_id === orderId) {
          console.log('[SSE] This order updated:', data);
          mutate();
        }
      },
    },
  });

  return {
    order: order || null,
    error,
    isLoading,
    mutate,
  };
}

export default useOrders;
