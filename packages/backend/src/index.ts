import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { fundingRatesRoutes, exchangesRoutes } from './routes/funding-rates.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { startFetchScheduler, stopFetchScheduler } from './jobs/fetch-funding-rates.job.js';
import { redis, bullMQConnection } from './cache/redis.js';
import { pool } from './db/client.js';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function start() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: true,
      credentials: true,
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(fundingRatesRoutes, { prefix: '/api/funding-rates' });
    await fastify.register(exchangesRoutes, { prefix: '/api/exchanges' });

    // Root route
    fastify.get('/', async () => ({
      name: 'Funding Rate Dashboard API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        fundingRates: '/api/funding-rates/current',
        historical: '/api/funding-rates/historical',
        summary: '/api/funding-rates/summary',
        arbitrage: '/api/funding-rates/arbitrage',
        exchanges: '/api/exchanges',
      },
    }));

    // Start server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`Server running at http://localhost:${config.server.port}`);

    // Start the fetch scheduler
    await startFetchScheduler();

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      await stopFetchScheduler();
      await fastify.close();
      await redis.quit();
      await bullMQConnection.quit();
      await pool.end();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
