import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.BACKEND_PORT || '3001', 10),
    host: process.env.BACKEND_HOST || '0.0.0.0',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'funding_rates',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  exchanges: {
    lighter: {
      apiKey: process.env.LIGHTER_API_KEY || '',
    },
    aster: {
      apiKey: process.env.ASTER_API_KEY || '',
      apiSecret: process.env.ASTER_API_SECRET || '',
    },
    variational: {
      apiKey: process.env.VARIATIONAL_API_KEY || '',
      apiSecret: process.env.VARIATIONAL_API_SECRET || '',
    },
    edgex: {
      apiKey: process.env.EDGEX_API_KEY || '',
    },
    grvt: {
      apiKey: process.env.GRVT_API_KEY || '',
    },
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },
  jobs: {
    fetchIntervalMs: parseInt(process.env.FETCH_INTERVAL_MS || '30000', 10), // 30 seconds
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '30', 10),
  },
};
