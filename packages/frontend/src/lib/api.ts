import type {
  FundingRate,
  FundingRateSummary,
  ArbitrageOpportunity,
  ExchangeId,
  TimeRange,
} from '@funding-dashboard/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface FundingRatesData {
  rates: FundingRate[];
  lastUpdated: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ExchangeData {
  id: ExchangeId;
  name: string;
  apiUrl: string;
  authRequired: boolean;
  fundingInterval: number;
  enabled: boolean;
  chain: string;
  website: string;
  status: 'ok' | 'error' | 'disabled';
  lastFetchTime?: string;
  rateCount: number;
  error?: string;
}

export interface FundingRatesParams {
  exchanges?: ExchangeId[];
  symbols?: string[];
  search?: string;
  minRate?: number;
  maxRate?: number;
  sortBy?: 'fundingRate' | 'fundingRateAnnualized' | 'symbol' | 'exchange';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  refresh?: boolean;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export async function getFundingRates(
  params: FundingRatesParams = {}
): Promise<FundingRatesData> {
  const searchParams = new URLSearchParams();

  if (params.exchanges?.length) {
    searchParams.set('exchanges', params.exchanges.join(','));
  }
  if (params.symbols?.length) {
    searchParams.set('symbols', params.symbols.join(','));
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.minRate !== undefined) {
    searchParams.set('minRate', params.minRate.toString());
  }
  if (params.maxRate !== undefined) {
    searchParams.set('maxRate', params.maxRate.toString());
  }
  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }
  if (params.page) {
    searchParams.set('page', params.page.toString());
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params.refresh) {
    searchParams.set('refresh', 'true');
  }

  const query = searchParams.toString();
  return fetchApi<FundingRatesData>(
    `/api/funding-rates/current${query ? `?${query}` : ''}`
  );
}

export async function getSummary(): Promise<FundingRateSummary> {
  return fetchApi<FundingRateSummary>('/api/funding-rates/summary');
}

export async function getArbitrage(): Promise<{
  opportunities: ArbitrageOpportunity[];
}> {
  return fetchApi<{ opportunities: ArbitrageOpportunity[] }>(
    '/api/funding-rates/arbitrage'
  );
}

export async function getExchanges(): Promise<{ exchanges: ExchangeData[] }> {
  return fetchApi<{ exchanges: ExchangeData[] }>('/api/exchanges');
}

export async function getHistoricalRates(
  symbol: string,
  exchanges?: ExchangeId[],
  range: TimeRange = '24h'
): Promise<{ symbol: string; range: TimeRange; rates: FundingRate[] }> {
  const searchParams = new URLSearchParams();
  searchParams.set('symbol', symbol);
  if (exchanges?.length) {
    searchParams.set('exchanges', exchanges.join(','));
  }
  searchParams.set('range', range);

  return fetchApi<{ symbol: string; range: TimeRange; rates: FundingRate[] }>(
    `/api/funding-rates/historical?${searchParams.toString()}`
  );
}

export async function getComparison(symbol: string): Promise<{
  symbol: string;
  rates: FundingRate[];
  spread: number;
}> {
  return fetchApi<{ symbol: string; rates: FundingRate[]; spread: number }>(
    `/api/funding-rates/comparison/${symbol}`
  );
}
