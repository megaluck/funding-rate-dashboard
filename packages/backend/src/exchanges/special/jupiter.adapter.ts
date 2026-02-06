import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

// Jupiter Perps uses borrow fees instead of traditional funding rates
// We'll fetch from their API or calculate from on-chain data

interface JupiterStatsResponse {
  pools: unknown[];
  markets: {
    symbol: string;
    markPrice: string;
    indexPrice: string;
    fundingRateLong: string;
    fundingRateShort: string;
    openInterest: string;
    volume24h: string;
  }[];
}

export class JupiterAdapter extends ExchangeAdapter {
  // Jupiter Perps API endpoints
  private readonly apiUrl = 'https://perps-api.jup.ag/v1';

  constructor(config: AdapterConfig = {}) {
    super('jupiter', config);
  }

  async fetchFundingRates(): Promise<FetchResult> {
    try {
      // Try to fetch from Jupiter's API
      const response = await this.safeFetch<JupiterStatsResponse>(
        `${this.apiUrl}/stats`
      );

      if (response.error || !response.data) {
        // Fallback: try alternate endpoint
        return this.fetchFromAlternateEndpoint();
      }

      const rates: FundingRate[] = [];

      if (response.data.markets) {
        for (const market of response.data.markets) {
          // Jupiter provides separate long/short rates
          // Use long rate as primary, but average if both available
          const longRate = parseFloat(market.fundingRateLong || '0');
          const shortRate = parseFloat(market.fundingRateShort || '0');
          const fundingRate = (longRate + shortRate) / 2;

          rates.push(
            this.createFundingRate({
              rawSymbol: market.symbol,
              fundingRate,
              markPrice: parseFloat(market.markPrice),
              indexPrice: parseFloat(market.indexPrice),
              openInterest: parseFloat(market.openInterest),
              volume24h: parseFloat(market.volume24h),
            })
          );
        }
      }

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  private async fetchFromAlternateEndpoint(): Promise<FetchResult> {
    try {
      // Try FluxBeam or similar aggregator that indexes Jupiter
      const response = await this.safeFetch<{
        data: {
          symbol: string;
          borrowRate: string;
          price: string;
          openInterest: string;
        }[];
      }>('https://api.fluxbeam.xyz/v1/jupiter-perps/markets');

      if (response.error || !response.data) {
        return this.errorResult('Could not fetch Jupiter data from any source');
      }

      const rates: FundingRate[] = response.data.data.map((item) => {
        // Convert borrow rate to funding-like rate
        const borrowRate = parseFloat(item.borrowRate || '0');

        return this.createFundingRate({
          rawSymbol: item.symbol,
          fundingRate: borrowRate,
          markPrice: parseFloat(item.price),
          openInterest: parseFloat(item.openInterest),
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
