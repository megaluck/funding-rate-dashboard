'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getFundingRates,
  getSummary,
  getExchanges,
  getArbitrage,
  getHistoricalRates,
  type FundingRatesParams,
} from '@/lib/api';
import type { ExchangeId, TimeRange } from '@funding-dashboard/shared';

export function useFundingRates(params: FundingRatesParams = {}) {
  return useQuery({
    queryKey: ['funding-rates', params],
    queryFn: () => getFundingRates(params),
    refetchInterval: 30000, // 30 seconds
  });
}

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    refetchInterval: 30000,
  });
}

export function useExchanges() {
  return useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    refetchInterval: 60000, // 1 minute
  });
}

export function useArbitrage() {
  return useQuery({
    queryKey: ['arbitrage'],
    queryFn: getArbitrage,
    refetchInterval: 30000,
  });
}

export function useHistoricalRates(
  symbol: string,
  exchanges?: ExchangeId[],
  range: TimeRange = '24h'
) {
  return useQuery({
    queryKey: ['historical', symbol, exchanges, range],
    queryFn: () => getHistoricalRates(symbol, exchanges, range),
    enabled: !!symbol,
    refetchInterval: 60000,
  });
}
