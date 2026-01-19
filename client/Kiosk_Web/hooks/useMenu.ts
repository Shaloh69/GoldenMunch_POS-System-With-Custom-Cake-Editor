import useSWR from 'swr';
import { MenuService } from '@/services/menu.service';
import { useSSE } from './useSSE';
import type { MenuItem, Category, MenuQueryParams } from '@/types/api';
import { API_BASE_URL } from '@/config/api';

/**
 * SWR + SSE hook for real-time menu items
 * Combines SWR for data fetching with SSE for real-time menu updates
 */
export function useMenuItems(params?: MenuQueryParams) {
  const {
    data: items,
    error,
    isLoading,
    mutate,
  } = useSWR<MenuItem[]>(
    ['menu-items', params],
    () => MenuService.getMenuItems(params),
    {
      refreshInterval: 0, // Disable polling, rely on SSE and cache
      revalidateOnFocus: false, // Don't revalidate on focus (menu doesn't change that often)
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  // Set up SSE connection for real-time menu updates
  useSSE({
    url: `${API_BASE_URL}/sse/menu`,
    enabled: true,
    events: {
      // When menu items are created/updated/deleted
      'menu.item.created': (data) => {
        console.log('[SSE] Menu item created:', data);
        mutate(); // Revalidate menu
      },

      'menu.item.updated': (data) => {
        console.log('[SSE] Menu item updated:', data);
        mutate(); // Revalidate menu
      },

      'menu.item.deleted': (data) => {
        console.log('[SSE] Menu item deleted:', data);
        mutate(); // Revalidate menu
      },

      'menu.item.stock_changed': (data) => {
        console.log('[SSE] Menu item stock changed:', data);
        mutate(); // Revalidate menu to reflect stock changes
      },

      // Connection established
      'connected': (data) => {
        console.log('[SSE] Connected to menu stream:', data);
      },
    },
    onError: (error) => {
      console.error('[SSE] Menu stream error:', error);
    },
  });

  return {
    items: items || [],
    error,
    isLoading,
    mutate,
  };
}

/**
 * SWR hook for categories
 */
export function useCategories() {
  const {
    data: categories,
    error,
    isLoading,
    mutate,
  } = useSWR<Category[]>(
    'categories',
    () => MenuService.getCategories(),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Categories rarely change, dedupe for 1 minute
    }
  );

  // Listen for menu updates (categories might be affected)
  useSSE({
    url: `${API_BASE_URL}/sse/menu`,
    enabled: true,
    events: {
      'menu.item.created': () => mutate(),
      'menu.item.updated': () => mutate(),
      'menu.item.deleted': () => mutate(),
    },
  });

  return {
    categories: categories || [],
    error,
    isLoading,
    mutate,
  };
}

export default useMenuItems;
