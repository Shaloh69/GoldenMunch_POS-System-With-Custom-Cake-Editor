import { useEffect, useRef, useCallback } from 'react';

/**
 * SSE Event handler type
 */
export type SSEEventHandler = (data: any) => void;

/**
 * SSE Hook options
 */
interface UseSSEOptions {
  /**
   * SSE endpoint URL
   */
  url: string;

  /**
   * Event handlers mapped by event type
   */
  events?: Record<string, SSEEventHandler>;

  /**
   * Callback when connection opens
   */
  onOpen?: () => void;

  /**
   * Callback when connection errors
   */
  onError?: (error: Event) => void;

  /**
   * Whether to enable SSE connection (default: true)
   */
  enabled?: boolean;

  /**
   * Whether to reconnect on disconnect (default: true)
   */
  reconnect?: boolean;

  /**
   * Reconnect delay in ms (default: 3000)
   */
  reconnectDelay?: number;
}

/**
 * Custom hook for Server-Sent Events (SSE)
 * Manages SSE connections with automatic reconnection
 */
export function useSSE(options: UseSSEOptions) {
  const {
    url,
    events = {},
    onOpen,
    onError,
    enabled = true,
    reconnect = true,
    reconnectDelay = 3000,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Create EventSource
      const eventSource = new EventSource(url, {
        withCredentials: false,
      });

      // Store last event ID for reconnection
      eventSource.addEventListener('message', (event: MessageEvent) => {
        if (event.lastEventId) {
          lastEventIdRef.current = event.lastEventId;
        }
      });

      // Handle connection open
      eventSource.onopen = () => {
        console.log(`[SSE] Connected to ${url}`);
        onOpen?.();
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error(`[SSE] Connection error for ${url}:`, error);
        onError?.(error);

        // Attempt reconnection
        if (reconnect && eventSource.readyState === EventSource.CLOSED) {
          console.log(`[SSE] Will reconnect in ${reconnectDelay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      // Register event handlers
      Object.entries(events).forEach(([eventType, handler]) => {
        eventSource.addEventListener(eventType, (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            handler(data);
          } catch (error) {
            console.error(`[SSE] Error parsing event data for ${eventType}:`, error);
          }
        });
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
    }
  }, [url, events, enabled, reconnect, reconnectDelay, onOpen, onError]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log(`[SSE] Disconnected from ${url}`);
    }
  }, [url]);

  /**
   * Get connection status
   */
  const getStatus = useCallback(() => {
    if (!eventSourceRef.current) {
      return 'disconnected';
    }

    switch (eventSourceRef.current.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'connected';
      case EventSource.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    getStatus,
  };
}

export default useSSE;
