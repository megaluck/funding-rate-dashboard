/**
 * Core funding rate data structure
 */
export interface FundingRate {
  /** Exchange identifier */
  exchange: ExchangeId;
  /** Trading pair symbol (normalized, e.g., "BTC-USD") */
  symbol: string;
  /** Raw symbol from the exchange */
  rawSymbol: string;
  /** Current funding rate (as decimal, e.g., 0.0001 = 0.01%) */
  fundingRate: number;
  /** Annualized funding rate (as decimal) */
  fundingRateAnnualized: number;
  /** Timestamp when this rate was fetched */
  timestamp: Date;
  /** Next funding payment time (if available) */
  nextFundingTime?: Date;
  /** Funding interval in hours */
  fundingInterval: number;
  /** Mark price (if available) */
  markPrice?: number;
  /** Index price (if available) */
  indexPrice?: number;
  /** Open interest (if available) */
  openInterest?: number;
  /** 24h volume (if available) */
  volume24h?: number;
}

/**
 * Supported exchange identifiers
 */
export type ExchangeId =
  | 'hyperliquid'
  | 'dydx'
  | 'gmx'
  | 'paradex'
  | 'lighter'
  | 'aster'
  | 'variational'
  | 'edgex'
  | 'grvt'
  | 'myx'
  | 'jupiter';

/**
 * Exchange metadata
 */
export interface Exchange {
  id: ExchangeId;
  name: string;
  /** Base API URL */
  apiUrl: string;
  /** Whether authentication is required */
  authRequired: boolean;
  /** Funding interval in hours */
  fundingInterval: number;
  /** Whether the exchange is currently enabled */
  enabled: boolean;
  /** Chain or network the exchange operates on */
  chain: string;
  /** Exchange website URL */
  website: string;
}

/**
 * Historical funding rate entry (for database storage)
 */
export interface FundingRateHistorical {
  time: Date;
  exchangeId: ExchangeId;
  symbol: string;
  fundingRate: number;
  fundingRateAnnualized: number;
  nextFundingTime?: Date;
  markPrice?: number;
}

/**
 * Filter options for querying funding rates
 */
export interface FundingRateFilter {
  /** Filter by exchange(s) */
  exchanges?: ExchangeId[];
  /** Filter by symbol(s) - normalized format */
  symbols?: string[];
  /** Search term for symbol */
  search?: string;
  /** Minimum funding rate */
  minRate?: number;
  /** Maximum funding rate */
  maxRate?: number;
  /** Sort field */
  sortBy?: 'fundingRate' | 'fundingRateAnnualized' | 'symbol' | 'exchange';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Pagination - page number (1-indexed) */
  page?: number;
  /** Pagination - items per page */
  limit?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API response for current funding rates
 */
export interface FundingRatesResponse {
  rates: FundingRate[];
  lastUpdated: Date;
  exchanges: ExchangeStatus[];
}

/**
 * Exchange status in API response
 */
export interface ExchangeStatus {
  id: ExchangeId;
  name: string;
  enabled: boolean;
  lastFetchTime?: Date;
  error?: string;
  rateCount: number;
}

/**
 * Arbitrage opportunity between exchanges
 */
export interface ArbitrageOpportunity {
  symbol: string;
  longExchange: ExchangeId;
  shortExchange: ExchangeId;
  longRate: number;
  shortRate: number;
  spreadAnnualized: number;
  timestamp: Date;
}

/**
 * Summary statistics for the dashboard
 */
export interface FundingRateSummary {
  /** Highest positive funding rate */
  highestRate: FundingRate | null;
  /** Lowest (most negative) funding rate */
  lowestRate: FundingRate | null;
  /** Average funding rate across all pairs */
  averageRate: number;
  /** Total number of markets tracked */
  totalMarkets: number;
  /** Top arbitrage opportunities */
  topArbitrage: ArbitrageOpportunity[];
}

/**
 * Time range for historical queries
 */
export type TimeRange = '1h' | '4h' | '24h' | '7d' | '30d';

/**
 * Historical data request parameters
 */
export interface HistoricalRequest {
  symbol: string;
  exchanges?: ExchangeId[];
  range: TimeRange;
  interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

/**
 * Chart data point for historical visualization
 */
export interface ChartDataPoint {
  timestamp: Date;
  exchange: ExchangeId;
  fundingRate: number;
  fundingRateAnnualized: number;
}
