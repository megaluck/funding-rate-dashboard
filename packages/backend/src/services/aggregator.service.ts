import type { ExchangeId, FundingRate, FundingRatesResponse, ExchangeStatus, FundingRateSummary, ArbitrageOpportunity } from '@funding-dashboard/shared';
import { EXCHANGES } from '@funding-dashboard/shared';
import { createAllAdapters, getConfiguredExchangeIds, type ExchangeAdapter, type FetchResult } from '../exchanges/index.js';
import { getCache, setCache } from '../cache/redis.js';
import { query } from '../db/client.js';

const CACHE_KEY_CURRENT = 'current-rates';
const CACHE_KEY_EXCHANGES = 'exchange-status';

export class AggregatorService {
  private adapters: Map<ExchangeId, ExchangeAdapter>;
  private lastResults: Map<ExchangeId, FetchResult> = new Map();

  constructor() {
    this.adapters = createAllAdapters();
  }

  /**
   * Get list of configured exchanges
   */
  getConfiguredExchanges(): ExchangeId[] {
    return getConfiguredExchangeIds(this.adapters);
  }

  /**
   * Fetch funding rates from all configured exchanges in parallel
   */
  async fetchAllRates(): Promise<FundingRatesResponse> {
    const configuredExchanges = this.getConfiguredExchanges();
    const fetchPromises = configuredExchanges.map(async (exchangeId) => {
      const adapter = this.adapters.get(exchangeId)!;
      const result = await adapter.fetchFundingRates();
      this.lastResults.set(exchangeId, result);
      return { exchangeId, result };
    });

    const results = await Promise.allSettled(fetchPromises);

    const allRates: FundingRate[] = [];
    const exchangeStatuses: ExchangeStatus[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { exchangeId, result: fetchResult } = result.value;
        const exchange = EXCHANGES[exchangeId];

        exchangeStatuses.push({
          id: exchangeId,
          name: exchange.name,
          enabled: true,
          lastFetchTime: fetchResult.fetchTime,
          error: fetchResult.error,
          rateCount: fetchResult.rates.length,
        });

        if (fetchResult.success) {
          allRates.push(...fetchResult.rates);
        }

        // Update fetch status in database
        await this.updateFetchStatus(exchangeId, fetchResult);
      }
    }

    // Add unconfigured exchanges as disabled
    for (const [exchangeId, exchange] of Object.entries(EXCHANGES)) {
      if (!configuredExchanges.includes(exchangeId as ExchangeId)) {
        exchangeStatuses.push({
          id: exchangeId as ExchangeId,
          name: exchange.name,
          enabled: false,
          rateCount: 0,
          error: 'Not configured',
        });
      }
    }

    const response: FundingRatesResponse = {
      rates: allRates,
      lastUpdated: new Date(),
      exchanges: exchangeStatuses,
    };

    // Cache the results
    await setCache(CACHE_KEY_CURRENT, response);
    await setCache(CACHE_KEY_EXCHANGES, exchangeStatuses);

    // Store in database
    await this.storeFundingRates(allRates);

    return response;
  }

  /**
   * Get current funding rates (from cache or fresh fetch)
   */
  async getCurrentRates(forceRefresh = false): Promise<FundingRatesResponse> {
    if (!forceRefresh) {
      const cached = await getCache<FundingRatesResponse>(CACHE_KEY_CURRENT);
      if (cached) {
        return cached;
      }
    }

    return this.fetchAllRates();
  }

  /**
   * Get rates for specific exchanges
   */
  async getRatesForExchanges(exchangeIds: ExchangeId[]): Promise<FundingRate[]> {
    const response = await this.getCurrentRates();
    return response.rates.filter((rate) => exchangeIds.includes(rate.exchange));
  }

  /**
   * Get rates for specific symbols
   */
  async getRatesForSymbols(symbols: string[]): Promise<FundingRate[]> {
    const response = await this.getCurrentRates();
    const normalizedSymbols = symbols.map((s) => s.toUpperCase());
    return response.rates.filter((rate) =>
      normalizedSymbols.includes(rate.symbol.toUpperCase())
    );
  }

  /**
   * Get exchange statuses
   */
  async getExchangeStatuses(): Promise<ExchangeStatus[]> {
    const cached = await getCache<ExchangeStatus[]>(CACHE_KEY_EXCHANGES);
    if (cached) return cached;

    const response = await this.getCurrentRates();
    return response.exchanges;
  }

  /**
   * Calculate summary statistics
   */
  async getSummary(): Promise<FundingRateSummary> {
    const response = await this.getCurrentRates();
    const rates = response.rates;

    if (rates.length === 0) {
      return {
        highestRate: null,
        lowestRate: null,
        averageRate: 0,
        totalMarkets: 0,
        topArbitrage: [],
      };
    }

    // Find highest and lowest rates
    let highestRate = rates[0];
    let lowestRate = rates[0];
    let sumRate = 0;

    for (const rate of rates) {
      if (rate.fundingRateAnnualized > highestRate.fundingRateAnnualized) {
        highestRate = rate;
      }
      if (rate.fundingRateAnnualized < lowestRate.fundingRateAnnualized) {
        lowestRate = rate;
      }
      sumRate += rate.fundingRateAnnualized;
    }

    // Calculate arbitrage opportunities
    const topArbitrage = this.findArbitrageOpportunities(rates);

    return {
      highestRate,
      lowestRate,
      averageRate: sumRate / rates.length,
      totalMarkets: rates.length,
      topArbitrage: topArbitrage.slice(0, 5),
    };
  }

  /**
   * Find arbitrage opportunities across exchanges
   */
  private findArbitrageOpportunities(rates: FundingRate[]): ArbitrageOpportunity[] {
    const bySymbol = new Map<string, FundingRate[]>();

    // Group by symbol
    for (const rate of rates) {
      const existing = bySymbol.get(rate.symbol) || [];
      existing.push(rate);
      bySymbol.set(rate.symbol, existing);
    }

    const opportunities: ArbitrageOpportunity[] = [];

    // Find spreads for symbols with multiple exchanges
    for (const [symbol, symbolRates] of bySymbol) {
      if (symbolRates.length < 2) continue;

      // Sort by annualized rate
      symbolRates.sort((a, b) => a.fundingRateAnnualized - b.fundingRateAnnualized);

      const lowest = symbolRates[0];
      const highest = symbolRates[symbolRates.length - 1];
      const spread = highest.fundingRateAnnualized - lowest.fundingRateAnnualized;

      if (Math.abs(spread) > 0.01) {
        // Only include if spread > 1%
        opportunities.push({
          symbol,
          longExchange: lowest.exchange, // Go long where rate is lowest
          shortExchange: highest.exchange, // Go short where rate is highest
          longRate: lowest.fundingRateAnnualized,
          shortRate: highest.fundingRateAnnualized,
          spreadAnnualized: spread,
          timestamp: new Date(),
        });
      }
    }

    // Sort by spread
    opportunities.sort((a, b) => b.spreadAnnualized - a.spreadAnnualized);

    return opportunities;
  }

  /**
   * Store funding rates in database
   */
  private async storeFundingRates(rates: FundingRate[]): Promise<void> {
    if (rates.length === 0) return;

    const values: unknown[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const rate of rates) {
      placeholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      values.push(
        rate.timestamp,
        rate.exchange,
        rate.symbol,
        rate.rawSymbol,
        rate.fundingRate,
        rate.fundingRateAnnualized,
        rate.nextFundingTime || null,
        rate.markPrice || null,
        rate.indexPrice || null,
        rate.openInterest || null
      );
    }

    const sql = `
      INSERT INTO funding_rates (
        time, exchange_id, symbol, raw_symbol, funding_rate,
        funding_rate_annualized, next_funding_time, mark_price,
        index_price, open_interest
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (time, exchange_id, symbol) DO UPDATE SET
        funding_rate = EXCLUDED.funding_rate,
        funding_rate_annualized = EXCLUDED.funding_rate_annualized,
        next_funding_time = EXCLUDED.next_funding_time,
        mark_price = EXCLUDED.mark_price,
        index_price = EXCLUDED.index_price,
        open_interest = EXCLUDED.open_interest
    `;

    try {
      await query(sql, values);
    } catch (err) {
      console.error('Failed to store funding rates:', err);
    }
  }

  /**
   * Update fetch status in database
   */
  private async updateFetchStatus(
    exchangeId: ExchangeId,
    result: FetchResult
  ): Promise<void> {
    const sql = `
      INSERT INTO fetch_status (exchange_id, last_fetch_time, last_success_time, last_error, rate_count, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (exchange_id) DO UPDATE SET
        last_fetch_time = $2,
        last_success_time = CASE WHEN $3 IS NOT NULL THEN $3 ELSE fetch_status.last_success_time END,
        last_error = $4,
        rate_count = $5,
        status = $6
    `;

    try {
      await query(sql, [
        exchangeId,
        result.fetchTime,
        result.success ? result.fetchTime : null,
        result.error || null,
        result.rates.length,
        result.success ? 'ok' : 'error',
      ]);
    } catch (err) {
      console.error('Failed to update fetch status:', err);
    }
  }

  /**
   * Get historical rates for a symbol
   */
  async getHistoricalRates(
    symbol: string,
    exchangeIds?: ExchangeId[],
    hours = 24
  ): Promise<FundingRate[]> {
    let sql = `
      SELECT
        time as timestamp,
        exchange_id as exchange,
        symbol,
        raw_symbol as "rawSymbol",
        funding_rate as "fundingRate",
        funding_rate_annualized as "fundingRateAnnualized",
        next_funding_time as "nextFundingTime",
        mark_price as "markPrice",
        index_price as "indexPrice",
        open_interest as "openInterest"
      FROM funding_rates
      WHERE symbol = $1
        AND time > NOW() - INTERVAL '${hours} hours'
    `;

    const params: unknown[] = [symbol];

    if (exchangeIds && exchangeIds.length > 0) {
      sql += ` AND exchange_id = ANY($2)`;
      params.push(exchangeIds);
    }

    sql += ` ORDER BY time DESC`;

    const result = await query<FundingRate>(sql, params);
    return result.rows;
  }
}

// Singleton instance
export const aggregatorService = new AggregatorService();
