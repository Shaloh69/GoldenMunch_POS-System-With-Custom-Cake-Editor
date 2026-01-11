import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

let redisClient: RedisClientType | null = null;
let isRedisEnabled = false;

/**
 * Initialize Redis connection
 * Supports both traditional host/port config and Redis URL (for cloud providers)
 */
export const initRedis = async (): Promise<void> => {
  const enabled = process.env.REDIS_ENABLED === 'true';

  if (!enabled) {
    logger.info('📦 Redis caching is disabled');
    isRedisEnabled = false;
    return;
  }

  try {
    // Check if REDIS_URL is provided (for cloud providers like Render, Heroku, Redis Cloud)
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      // Use connection URL
      logger.info('📦 Connecting to Redis using REDIS_URL...');
      redisClient = createClient({
        url: redisUrl,
      });
    } else {
      // Use individual configuration parameters
      logger.info('📦 Connecting to Redis using host/port configuration...');
      const useTLS = process.env.REDIS_TLS === 'true';

      redisClient = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          ...(useTLS && { tls: true }),
        },
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0', 10),
      });
    }

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isRedisEnabled = false;
    });

    redisClient.on('connect', () => {
      logger.info('📦 Redis client connected');
      isRedisEnabled = true;
    });

    redisClient.on('ready', () => {
      logger.info('📦 Redis client ready');
      isRedisEnabled = true;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('📦 Redis client reconnecting...');
    });

    await redisClient.connect();
    logger.info('✅ Redis connection established');
    isRedisEnabled = true;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    logger.warn('⚠️  Continuing without Redis caching');
    isRedisEnabled = false;
    redisClient = null;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Check if Redis is enabled and connected
 */
export const isRedisReady = (): boolean => {
  return isRedisEnabled && redisClient !== null && redisClient.isReady;
};

/**
 * Close Redis connection gracefully
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('📦 Redis connection closed');
  }
};

export default {
  initRedis,
  getRedisClient,
  isRedisReady,
  closeRedis,
};
