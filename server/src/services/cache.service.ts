import { getRedisClient, isRedisReady } from '../config/redis';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * Cache Service - Provides caching utilities with Redis
 */
export class CacheService {
  private static defaultTTL = parseInt(process.env.REDIS_DEFAULT_TTL || '300', 10); // 5 minutes

  /**
   * Generate cache key with prefix
   */
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Generate ETag from data
   */
  static generateETag(data: any): string {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }

  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!isRedisReady()) {
      return null;
    }

    try {
      const client = getRedisClient();
      if (!client) return null;

      const cached = await client.get(key);
      if (!cached || typeof cached !== 'string') return null;

      return JSON.parse(cached) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  static async set(key: string, data: any, ttlSeconds?: number): Promise<boolean> {
    if (!isRedisReady()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const ttl = ttlSeconds || this.defaultTTL;
      await client.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  static async del(key: string): Promise<boolean> {
    if (!isRedisReady()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data by pattern
   */
  static async delByPattern(pattern: string): Promise<number> {
    if (!isRedisReady()) {
      return 0;
    }

    try {
      const client = getRedisClient();
      if (!client) return 0;

      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;

      await client.del(keys);
      logger.info(`🗑️  Deleted ${keys.length} cache entries matching pattern: ${pattern}`);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete by pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    if (!isRedisReady()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  static async flushAll(): Promise<boolean> {
    if (!isRedisReady()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.flushDb();
      logger.info('🗑️  Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  static async ttl(key: string): Promise<number> {
    if (!isRedisReady()) {
      return -2;
    }

    try {
      const client = getRedisClient();
      if (!client) return -2;

      return await client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Increment a counter
   */
  static async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!isRedisReady()) {
      return 0;
    }

    try {
      const client = getRedisClient();
      if (!client) return 0;

      const value = await client.incr(key);

      // Set TTL if this is the first increment
      if (value === 1 && ttlSeconds) {
        await client.expire(key, ttlSeconds);
      }

      return value;
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }
}

/**
 * Cache TTL presets for different data types
 */
export const CacheTTL = {
  VERY_SHORT: 10,        // 10 seconds - Real-time data
  SHORT: 30,             // 30 seconds - Frequently changing data
  MEDIUM: 300,           // 5 minutes - Default
  LONG: 900,             // 15 minutes - Rarely changing data
  VERY_LONG: 3600,       // 1 hour - Static data
  DAY: 86400,            // 24 hours - Very static data
};

/**
 * Cache key prefixes for organization
 */
export const CacheKeys = {
  MENU_ITEMS: 'menu:items',
  MENU_ITEM: 'menu:item',
  CATEGORIES: 'menu:categories',
  PROMOTIONS: 'menu:promotions',
  ORDERS: 'orders:list',
  ORDER: 'orders:item',
  FLAVORS: 'cake:flavors',
  SIZES: 'cake:sizes',
  THEMES: 'cake:themes',
  ANALYTICS: 'analytics',
  INVENTORY: 'inventory',
  DISCOUNTS: 'discounts',
  CAPACITY: 'capacity',
};

export default CacheService;
