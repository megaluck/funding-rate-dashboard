import type { Exchange, ExchangeId } from '../types/funding-rate.js';

/**
 * Exchange configurations
 */
export const EXCHANGES: Record<ExchangeId, Exchange> = {
  hyperliquid: {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    apiUrl: 'https://api.hyperliquid.xyz',
    authRequired: false,
    fundingInterval: 1,
    enabled: true,
    chain: 'Hyperliquid L1',
    website: 'https://hyperliquid.xyz',
  },
  dydx: {
    id: 'dydx',
    name: 'dYdX v4',
    apiUrl: 'https://indexer.v4mainnet.dydx.exchange',
    authRequired: false,
    fundingInterval: 8,
    enabled: true,
    chain: 'dYdX Chain',
    website: 'https://dydx.exchange',
  },
  gmx: {
    id: 'gmx',
    name: 'GMX',
    apiUrl: 'https://arbitrum-api.gmxinfra.io',
    authRequired: false,
    fundingInterval: 1, // Dynamic, uses 1h for annualization
    enabled: true,
    chain: 'Arbitrum',
    website: 'https://gmx.io',
  },
  paradex: {
    id: 'paradex',
    name: 'Paradex',
    apiUrl: 'wss://streaming.prod.paradex.trade',
    authRequired: false,
    fundingInterval: 8,
    enabled: true,
    chain: 'Starknet',
    website: 'https://paradex.trade',
  },
  lighter: {
    id: 'lighter',
    name: 'Lighter',
    apiUrl: 'https://mainnet.zklighter.elliot.ai',
    authRequired: true,
    fundingInterval: 1,
    enabled: true,
    chain: 'zkSync',
    website: 'https://lighter.xyz',
  },
  aster: {
    id: 'aster',
    name: 'Aster (SynFutures)',
    apiUrl: 'https://fapi.asterdex.com',
    authRequired: true,
    fundingInterval: 8,
    enabled: true,
    chain: 'Multiple',
    website: 'https://asterdex.com',
  },
  variational: {
    id: 'variational',
    name: 'Variational',
    apiUrl: 'https://api.variational.io',
    authRequired: true,
    fundingInterval: 1,
    enabled: true,
    chain: 'Ethereum',
    website: 'https://variational.io',
  },
  edgex: {
    id: 'edgex',
    name: 'EdgeX',
    apiUrl: 'https://api.edgex.exchange',
    authRequired: true,
    fundingInterval: 8,
    enabled: true,
    chain: 'Multiple',
    website: 'https://edgex.exchange',
  },
  grvt: {
    id: 'grvt',
    name: 'GRVT',
    apiUrl: 'https://api.grvt.io',
    authRequired: true,
    fundingInterval: 8,
    enabled: true,
    chain: 'zkSync',
    website: 'https://grvt.io',
  },
  myx: {
    id: 'myx',
    name: 'MYX Finance',
    apiUrl: 'https://api.myx.finance',
    authRequired: false,
    fundingInterval: 8,
    enabled: true,
    chain: 'Arbitrum',
    website: 'https://myx.finance',
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter Perps',
    apiUrl: 'https://api.mainnet-beta.solana.com',
    authRequired: false,
    fundingInterval: 1, // Continuous borrow fees
    enabled: true,
    chain: 'Solana',
    website: 'https://jup.ag/perps',
  },
};

/**
 * List of all exchange IDs
 */
export const EXCHANGE_IDS: ExchangeId[] = Object.keys(EXCHANGES) as ExchangeId[];

/**
 * Public exchanges (no auth required)
 */
export const PUBLIC_EXCHANGES: ExchangeId[] = EXCHANGE_IDS.filter(
  (id) => !EXCHANGES[id].authRequired
);

/**
 * Authenticated exchanges
 */
export const AUTHENTICATED_EXCHANGES: ExchangeId[] = EXCHANGE_IDS.filter(
  (id) => EXCHANGES[id].authRequired
);
