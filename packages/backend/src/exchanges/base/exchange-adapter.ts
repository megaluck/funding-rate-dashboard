import type { ExchangeId, FundingRate, Exchange } from '@funding-dashboard/shared';
import { annualizeFundingRate, normalizeSymbol, EXCHANGES } from '@funding-dashboard/shared';

export interface AdapterConfig {
  apiKey?: string;
  apiSecret?: string;
  rpcUrl?: string;
}

export interface FetchResult {
  success: boolean;
  rates: FundingRate[];
  error?: string;
  fetchTime: Date;
}

/**
 * Abstract base class for exchange adapters
 */
export abstract class ExchangeAdapter {
  protected readonly exchangeId: ExchangeId;
  protected readonly exchange: Exchange;
  protected readonly config: AdapterConfig;
  protected lastFetchTime: Date | null = null;
  protected lastError: string | null = null;

  constructor(exchangeId: ExchangeId, config: AdapterConfig = {}) {
    this.exchangeId = exchangeId;
    this.exchange = EXCHANGES[exchangeId];
    this.config = config;
  }

  /**
   * Fetch current funding rates from the exchange
   */
  abstract fetchFundingRates(): Promise<FetchResult>;

  /**
   * Check if the adapter is properly configured (has required credentials)
   */
  isConfigured(): boolean {
    if (!this.exchange.authRequired) return true;
    // Subclasses should override for specific requirements
    return true;
  }

  /**
   * Get exchange metadata
   */
  getExchange(): Exchange {
    return this.exchange;
  }

  /**
   * Get the exchange ID
   */
  getExchangeId(): ExchangeId {
    return this.exchangeId;
  }

  /**
   * Get last fetch time
   */
  getLastFetchTime(): Date | null {
    return this.lastFetchTime;
  }

  /**
   * Get last error
   */
  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Create a normalized FundingRate object
   */
  protected createFundingRate(data: {
    rawSymbol: string;
    fundingRate: number;
    markPrice?: number;
    indexPrice?: number;
    openInterest?: number;
    volume24h?: number;
    nextFundingTime?: Date;
  }): FundingRate {
    const symbol = normalizeSymbol(data.rawSymbol);
    const fundingRateAnnualized = annualizeFundingRate(
      data.fundingRate,
      this.exchange.fundingInterval
    );

    return {
      exchange: this.exchangeId,
      symbol,
      rawSymbol: data.rawSymbol,
      fundingRate: data.fundingRate,
      fundingRateAnnualized,
      timestamp: new Date(),
      fundingInterval: this.exchange.fundingInterval,
      nextFundingTime: data.nextFundingTime,
      markPrice: data.markPrice,
      indexPrice: data.indexPrice,
      openInterest: data.openInterest,
      volume24h: data.volume24h,
    };
  }

  /**
   * Wrap fetch with error handling and timing
   */
  protected async safeFetch<T>(
    url: string,
    options?: RequestInit
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        return {
          data: null,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json() as T;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown fetch error',
      };
    }
  }

  /**
   * Create a success result
   */
  protected successResult(rates: FundingRate[]): FetchResult {
    this.lastFetchTime = new Date();
    this.lastError = null;
    return {
      success: true,
      rates,
      fetchTime: this.lastFetchTime,
    };
  }

  /**
   * Create an error result
   */
  protected errorResult(error: string): FetchResult {
    this.lastFetchTime = new Date();
    this.lastError = error;
    return {
      success: false,
      rates: [],
      error,
      fetchTime: this.lastFetchTime,
    };
  }
}
