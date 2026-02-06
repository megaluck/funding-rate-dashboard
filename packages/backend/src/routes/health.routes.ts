import type { FastifyPluginAsync } from 'fastify';
import type { HealthResponse } from '@funding-dashboard/shared';
import { testConnection } from '../db/client.js';
import { testRedisConnection } from '../cache/redis.js';
import { aggregatorService } from '../services/aggregator.service.js';

const startTime = Date.now();

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (): Promise<HealthResponse> => {
    const [dbConnected, redisConnected] = await Promise.all([
      testConnection(),
      testRedisConnection(),
    ]);

    const exchangeStatuses = await aggregatorService.getExchangeStatuses();

    const allHealthy = dbConnected && redisConnected;
    const anyExchangeError = exchangeStatuses.some(
      (e) => e.enabled && e.error
    );

    return {
      status: !allHealthy ? 'unhealthy' : anyExchangeError ? 'degraded' : 'healthy',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected',
        exchanges: exchangeStatuses.map((e) => ({
          id: e.id,
          status: e.error ? 'error' : 'ok',
          lastCheck: e.lastFetchTime
            ? (typeof e.lastFetchTime === 'string' ? e.lastFetchTime : e.lastFetchTime.toISOString())
            : undefined,
        })),
      },
    };
  });

  fastify.get('/ready', async (_, reply) => {
    const dbConnected = await testConnection();
    const redisConnected = await testRedisConnection();

    if (dbConnected && redisConnected) {
      return { ready: true };
    }

    return reply.status(503).send({
      ready: false,
      database: dbConnected,
      redis: redisConnected,
    });
  });

  fastify.get('/live', async () => {
    return { alive: true };
  });
};
