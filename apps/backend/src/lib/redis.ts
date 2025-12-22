import { createClient, RedisClientType } from 'redis';
import { config } from '../config/env';

let redisClient: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: config.redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  redisClient.on('disconnect', () => {
    console.log('⚠️  Disconnected from Redis');
  });

  await redisClient.connect();

  return redisClient;
};

// Graceful shutdown
process.on('beforeExit', async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
});

// Helper functions for common Redis operations
export const cacheHelpers = {
  /**
   * Set a value with expiration (in seconds)
   */
  async set(key: string, value: string, expirationInSeconds?: number): Promise<void> {
    const client = await getRedisClient();
    if (expirationInSeconds) {
      await client.setEx(key, expirationInSeconds, value);
    } else {
      await client.set(key, value);
    }
  },

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    const client = await getRedisClient();
    return await client.get(key);
  },

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },

  /**
   * Increment a counter (useful for rate limiting)
   */
  async incr(key: string): Promise<number> {
    const client = await getRedisClient();
    return await client.incr(key);
  },

  /**
   * Set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = await getRedisClient();
    await client.expire(key, seconds);
  },
};

export default getRedisClient;
