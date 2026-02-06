import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface LighterFundingRate {
  market: string;
  fundingRate: string;
  markPrice: string;
  indexPrice: string;
  openInterest: string;
  nextFundingTime: number;
}

interface LighterResponse {
  data: LighterFundingRate[];
}

export class LighterAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://mainnet.zklighter.elliot.ai/api/v1/funding-rates';

  constructor(config: AdapterConfig = {}) {
    super('lighter', config);
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async fetchFundingRates(): Promise<FetchResult> {
    if (!this.isConfigured()) {
      return this.errorResult('API key not configured');
    }

    try {
      const response = await this.safeFetch<LighterResponse>(this.apiUrl, {
        headers: {
          'X-API-Key': this.config.apiKey!,
        },
      });

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      const rates: FundingRate[] = response.data.data.map((item) => {
        const fundingRate = parseFloat(item.fundingRate || '0');

        return this.createFundingRate({
          rawSymbol: item.market,
          fundingRate,
          markPrice: parseFloat(item.markPrice),
          indexPrice: parseFloat(item.indexPrice),
          openInterest: parseFloat(item.openInterest),
          nextFundingTime: item.nextFundingTime ? new Date(item.nextFundingTime) : undefined,
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
