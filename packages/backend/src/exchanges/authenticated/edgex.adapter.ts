import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface EdgeXFundingRate {
  symbol: string;
  fundingRate: string;
  fundingRateE8: string;
  nextFundingTime: number;
  markPrice: string;
  indexPrice: string;
}

interface EdgeXResponse {
  code: number;
  data: EdgeXFundingRate[];
}

export class EdgeXAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://api.edgex.exchange/api/v1/public/funding/getLatestFundingRate';

  constructor(config: AdapterConfig = {}) {
    super('edgex', config);
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async fetchFundingRates(): Promise<FetchResult> {
    if (!this.isConfigured()) {
      return this.errorResult('API key not configured');
    }

    try {
      const response = await this.safeFetch<EdgeXResponse>(this.apiUrl, {
        headers: {
          'X-EDGEX-API-KEY': this.config.apiKey!,
        },
      });

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      if (response.data.code !== 0 || !response.data.data) {
        return this.errorResult('Invalid response format');
      }

      const rates: FundingRate[] = response.data.data.map((item) => {
        // EdgeX may provide fundingRateE8 (rate * 1e8) or fundingRate
        const fundingRate = item.fundingRate
          ? parseFloat(item.fundingRate)
          : parseFloat(item.fundingRateE8) / 1e8;

        return this.createFundingRate({
          rawSymbol: item.symbol,
          fundingRate,
          markPrice: parseFloat(item.markPrice),
          indexPrice: parseFloat(item.indexPrice),
          nextFundingTime: item.nextFundingTime ? new Date(item.nextFundingTime) : undefined,
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
