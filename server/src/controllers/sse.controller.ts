import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { sseService, SSEChannels } from '../services/sse.service';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * SSE Controller - Handles Server-Sent Events connections
 */

/**
 * Connect to SSE stream for orders (cashier/admin)
 */
export const streamOrders = async (req: AuthRequest, res: Response) => {
  const clientId = `orders-${req.user?.id || 'anonymous'}-${crypto.randomBytes(8).toString('hex')}`;
  const lastEventId = req.headers['last-event-id'] as string | undefined;

  logger.info(`SSE orders stream requested by user: ${req.user?.id}`);

  sseService.registerClient(
    clientId,
    res,
    SSEChannels.ORDERS,
    req.user?.id?.toString(),
    lastEventId
  );
};

/**
 * Connect to SSE stream for menu updates (kiosk)
 */
export const streamMenu = async (req: AuthRequest, res: Response) => {
  const clientId = `menu-${crypto.randomBytes(8).toString('hex')}`;
  const lastEventId = req.headers['last-event-id'] as string | undefined;

  logger.info('SSE menu stream requested');

  sseService.registerClient(
    clientId,
    res,
    SSEChannels.MENU,
    undefined,
    lastEventId
  );
};

/**
 * Connect to SSE stream for inventory updates (admin)
 */
export const streamInventory = async (req: AuthRequest, res: Response) => {
  const clientId = `inventory-${req.user?.id || 'anonymous'}-${crypto.randomBytes(8).toString('hex')}`;
  const lastEventId = req.headers['last-event-id'] as string | undefined;

  logger.info(`SSE inventory stream requested by user: ${req.user?.id}`);

  sseService.registerClient(
    clientId,
    res,
    SSEChannels.INVENTORY,
    req.user?.id?.toString(),
    lastEventId
  );
};

/**
 * Connect to SSE stream for custom cake updates (admin/cashier)
 */
export const streamCustomCakes = async (req: AuthRequest, res: Response) => {
  const clientId = `custom-cakes-${req.user?.id || 'anonymous'}-${crypto.randomBytes(8).toString('hex')}`;
  const lastEventId = req.headers['last-event-id'] as string | undefined;

  logger.info(`SSE custom cakes stream requested by user: ${req.user?.id}`);

  sseService.registerClient(
    clientId,
    res,
    SSEChannels.CUSTOM_CAKES,
    req.user?.id?.toString(),
    lastEventId
  );
};

/**
 * Connect to SSE stream for notifications (all authenticated users)
 */
export const streamNotifications = async (req: AuthRequest, res: Response) => {
  const clientId = `notifications-${req.user?.id || 'anonymous'}-${crypto.randomBytes(8).toString('hex')}`;
  const lastEventId = req.headers['last-event-id'] as string | undefined;

  logger.info(`SSE notifications stream requested by user: ${req.user?.id}`);

  sseService.registerClient(
    clientId,
    res,
    SSEChannels.NOTIFICATIONS,
    req.user?.id?.toString(),
    lastEventId
  );
};

/**
 * Get SSE statistics (admin only)
 */
export const getSSEStats = async (_req: AuthRequest, res: Response) => {
  const stats = sseService.getStats();
  res.json({
    success: true,
    data: stats,
  });
};
