import Redis from 'ioredis';
import { config } from '../config/index.js';

export const redis = new Redis.default({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err: Error) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

const CACHE_PREFIX = 'funding:';

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(CACHE_PREFIX + key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache<T>(key: string, value: T, ttlSeconds = config.cache.ttlSeconds): Promise<void> {
  await redis.setex(CACHE_PREFIX + key, ttlSeconds, JSON.stringify(value));
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(CACHE_PREFIX + key);
}

export async function clearCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(CACHE_PREFIX + pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
