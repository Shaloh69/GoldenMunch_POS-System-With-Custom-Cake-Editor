import { Request, Response, NextFunction } from 'express';
import { CacheService, CacheTTL } from '../services/cache.service';
import logger from '../utils/logger';

/**
 * Cache middleware for GET requests
 * Caches successful responses and serves from cache when available
 */
export const cacheMiddleware = (ttlSeconds: number = CacheTTL.MEDIUM) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      // Check if client sent If-None-Match header (ETag)
      const clientETag = req.headers['if-none-match'];

      // Try to get cached response
      const cached = await CacheService.get<{
        data: any;
        etag: string;
        timestamp: number;
      }>(cacheKey);

      if (cached) {
        // Check if ETag matches
        if (clientETag && clientETag === cached.etag) {
          logger.debug(`📦 Cache hit + ETag match for ${req.url} - 304 Not Modified`);
          return res.status(304).end();
        }

        // Serve from cache
        logger.debug(`📦 Cache hit for ${req.url}`);
        return res
          .set('ETag', cached.etag)
          .set('X-Cache', 'HIT')
          .set('Cache-Control', `public, max-age=${ttlSeconds}`)
          .json(cached.data);
      }

      // Cache miss - store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function (data: any): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const etag = CacheService.generateETag(data);

          // Store in cache
          CacheService.set(
            cacheKey,
            {
              data,
              etag,
              timestamp: Date.now(),
            },
            ttlSeconds
          ).catch((err) => logger.error('Cache set error:', err));

          // Set cache headers
          res.set('ETag', etag);
          res.set('X-Cache', 'MISS');
          res.set('Cache-Control', `public, max-age=${ttlSeconds}`);

          logger.debug(`📦 Cache miss for ${req.url} - stored in cache`);
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware for mutations (POST, PUT, PATCH, DELETE)
 * Invalidates cache entries matching the specified patterns
 */
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (data: any): Response {
      // Only invalidate on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns asynchronously
        Promise.all(
          patterns.map((pattern) => CacheService.delByPattern(pattern))
        ).catch((err) => logger.error('Cache invalidation error:', err));

        logger.debug(`🗑️  Cache invalidated for patterns: ${patterns.join(', ')}`);
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Smart cache invalidation based on route patterns
 * Automatically determines which cache keys to invalidate based on the route
 */
export const autoInvalidateCache = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only for mutations
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (data: any): Response {
      // Only invalidate on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const path = req.path;
        const patterns: string[] = [];

        // Determine which cache patterns to invalidate based on route
        // IMPORTANT: Cache keys include /api/ prefix, so patterns must match that
        if (path.includes('/menu')) {
          patterns.push('cache:/api/kiosk/menu*');
          patterns.push('cache:/api/admin/menu*');
          patterns.push('menu:*');
        }

        if (path.includes('/categories')) {
          patterns.push('cache:/api/kiosk/categories*');
          patterns.push('cache:/api/admin/categories*');
          patterns.push('menu:categories*');
        }

        if (path.includes('/order')) {
          patterns.push('cache:/api/kiosk/orders*');
          patterns.push('cache:/api/cashier/orders*');
          patterns.push('cache:/api/admin/orders*');
          patterns.push('orders:*');
        }

        // Payment verification affects stock, so invalidate menu cache
        if (path.includes('/payment/verify')) {
          patterns.push('cache:/api/kiosk/menu*');
          patterns.push('cache:/api/admin/menu*');
          patterns.push('cache:/api/admin/inventory*');
          patterns.push('menu:*');
          patterns.push('inventory:*');
        }

        // Xendit webhook auto-completes orders and deducts stock
        if (path.includes('/webhooks/xendit')) {
          patterns.push('cache:/api/kiosk/menu*');
          patterns.push('cache:/api/admin/menu*');
          patterns.push('cache:/api/admin/inventory*');
          patterns.push('cache:/api/kiosk/orders*');
          patterns.push('cache:/api/cashier/orders*');
          patterns.push('menu:*');
          patterns.push('inventory:*');
          patterns.push('orders:*');
        }

        if (path.includes('/promotion')) {
          patterns.push('cache:/api/kiosk/promotions*');
          patterns.push('cache:/api/admin/promotions*');
          patterns.push('menu:promotions*');
        }

        if (path.includes('/inventory')) {
          patterns.push('cache:/api/admin/inventory*');
          patterns.push('inventory:*');
        }

        if (path.includes('/discount')) {
          patterns.push('cache:/api/kiosk/discounts*');
          patterns.push('cache:/api/cashier/discounts*');
          patterns.push('cache:/api/admin/discounts*');
          patterns.push('discounts:*');
        }

        if (path.includes('/cake')) {
          patterns.push('cache:/api/kiosk/cake/*');
          patterns.push('cache:/api/cashier/cake/*');
          patterns.push('cache:/api/admin/cake/*');
          patterns.push('cake:*');
        }

        if (path.includes('/capacity')) {
          patterns.push('cache:/api/kiosk/capacity*');
          patterns.push('cache:/api/cashier/capacity*');
          patterns.push('cache:/api/admin/capacity*');
          patterns.push('capacity:*');
        }

        // Invalidate cache patterns asynchronously
        if (patterns.length > 0) {
          Promise.all(
            patterns.map((pattern) => CacheService.delByPattern(pattern))
          ).catch((err) => logger.error('Auto cache invalidation error:', err));

          logger.debug(`🗑️  Auto-invalidated cache for patterns: ${patterns.join(', ')}`);
        }
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Conditional request support (If-None-Match / ETag)
 * For routes that don't use the cache middleware
 */
export const conditionalRequest = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to add ETag
    res.json = function (data: any): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const etag = CacheService.generateETag(data);
        const clientETag = req.headers['if-none-match'];

        // Check if ETag matches
        if (clientETag && clientETag === etag) {
          logger.debug(`✅ ETag match for ${req.url} - 304 Not Modified`);
          return res.status(304).end() as Response;
        }

        res.set('ETag', etag);
        res.set('Cache-Control', 'no-cache');
      }

      return originalJson(data);
    };

    next();
  };
};

export default {
  cacheMiddleware,
  invalidateCache,
  autoInvalidateCache,
  conditionalRequest,
};
