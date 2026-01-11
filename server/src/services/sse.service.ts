import { Response } from 'express';
import logger from '../utils/logger';

/**
 * Server-Sent Events (SSE) Service
 * Manages real-time event streaming to connected clients
 */

interface SSEClient {
  id: string;
  response: Response;
  channel: string;
  userId?: string;
  lastEventId?: string;
}

class SSEService {
  private clients: Map<string, SSEClient> = new Map();
  private eventHistory: Map<string, any[]> = new Map();
  private maxHistorySize = 100;

  /**
   * Register a new SSE client
   */
  registerClient(
    clientId: string,
    response: Response,
    channel: string,
    userId?: string,
    lastEventId?: string
  ): void {
    // Set SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    // Store client
    this.clients.set(clientId, {
      id: clientId,
      response,
      channel,
      userId,
      lastEventId,
    });

    logger.info(`SSE client connected: ${clientId} on channel: ${channel}`);

    // Send initial connection message
    this.sendToClient(clientId, 'connected', {
      clientId,
      channel,
      timestamp: new Date().toISOString(),
    });

    // If client provided lastEventId, send missed events
    if (lastEventId) {
      this.sendMissedEvents(clientId, channel, lastEventId);
    }

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      logger.info(`SSE client disconnected: ${clientId} from channel: ${client.channel}`);
    }
  }

  /**
   * Send event to a specific client
   */
  sendToClient(clientId: string, event: string, data: any, eventId?: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    try {
      const id = eventId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (eventId) {
        client.response.write(`id: ${id}\n`);
      }
      client.response.write(`event: ${event}\n`);
      client.response.write(`data: ${JSON.stringify(data)}\n\n`);

      return true;
    } catch (error) {
      logger.error(`Error sending to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Broadcast event to all clients on a channel
   */
  broadcast(channel: string, event: string, data: any, options?: { userId?: string }): number {
    let sentCount = 0;
    const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store in history
    this.addToHistory(channel, { eventId, event, data, timestamp: Date.now() });

    this.clients.forEach((client) => {
      if (client.channel === channel) {
        // If userId specified, only send to that user
        if (options?.userId && client.userId !== options.userId) {
          return;
        }

        if (this.sendToClient(client.id, event, data, eventId)) {
          sentCount++;
        }
      }
    });

    logger.debug(`Broadcast to ${sentCount} clients on channel: ${channel}, event: ${event}`);
    return sentCount;
  }

  /**
   * Send heartbeat to keep connections alive
   */
  sendHeartbeat(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    try {
      client.response.write(': heartbeat\n\n');
      return true;
    } catch (error) {
      logger.error(`Error sending heartbeat to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Send heartbeat to all connected clients
   */
  heartbeatAll(): void {
    this.clients.forEach((client) => {
      this.sendHeartbeat(client.id);
    });
  }

  /**
   * Get number of connected clients
   */
  getClientCount(channel?: string): number {
    if (!channel) {
      return this.clients.size;
    }

    let count = 0;
    this.clients.forEach((client) => {
      if (client.channel === channel) {
        count++;
      }
    });
    return count;
  }

  /**
   * Add event to history
   */
  private addToHistory(channel: string, event: any): void {
    if (!this.eventHistory.has(channel)) {
      this.eventHistory.set(channel, []);
    }

    const history = this.eventHistory.get(channel)!;
    history.push(event);

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Send missed events to reconnecting client
   */
  private sendMissedEvents(clientId: string, channel: string, lastEventId: string): void {
    const history = this.eventHistory.get(channel);
    if (!history) {
      return;
    }

    const lastEventIndex = history.findIndex((e) => e.eventId === lastEventId);
    if (lastEventIndex === -1) {
      return;
    }

    // Send all events after the last received one
    const missedEvents = history.slice(lastEventIndex + 1);
    missedEvents.forEach((event) => {
      this.sendToClient(clientId, event.event, event.data, event.eventId);
    });

    logger.info(`Sent ${missedEvents.length} missed events to client ${clientId}`);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalClients: number;
    channelStats: Record<string, number>;
  } {
    const channelStats: Record<string, number> = {};

    this.clients.forEach((client) => {
      channelStats[client.channel] = (channelStats[client.channel] || 0) + 1;
    });

    return {
      totalClients: this.clients.size,
      channelStats,
    };
  }
}

// Export singleton instance
export const sseService = new SSEService();

// Start heartbeat interval (every 30 seconds)
setInterval(() => {
  sseService.heartbeatAll();
}, 30000);

/**
 * Event channel constants
 */
export const SSEChannels = {
  ORDERS: 'orders',
  MENU: 'menu',
  INVENTORY: 'inventory',
  CUSTOM_CAKES: 'custom-cakes',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Event type constants
 */
export const SSEEvents = {
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  ORDER_DELETED: 'order.deleted',
  ORDER_PRINTED: 'order.printed',

  // Menu events
  MENU_ITEM_CREATED: 'menu.item.created',
  MENU_ITEM_UPDATED: 'menu.item.updated',
  MENU_ITEM_DELETED: 'menu.item.deleted',
  MENU_ITEM_STOCK_CHANGED: 'menu.item.stock_changed',

  // Inventory events
  INVENTORY_ALERT: 'inventory.alert',
  INVENTORY_UPDATED: 'inventory.updated',

  // Custom cake events
  CUSTOM_CAKE_SUBMITTED: 'custom_cake.submitted',
  CUSTOM_CAKE_APPROVED: 'custom_cake.approved',
  CUSTOM_CAKE_REJECTED: 'custom_cake.rejected',
  CUSTOM_CAKE_COMPLETED: 'custom_cake.completed',
  CUSTOM_CAKE_MESSAGE_RECEIVED: 'custom_cake.message_received',
  CUSTOM_CAKE_MESSAGES_READ: 'custom_cake.messages_read',

  // Generic events
  NOTIFICATION: 'notification',
  CACHE_INVALIDATED: 'cache.invalidated',
} as const;

export default sseService;
