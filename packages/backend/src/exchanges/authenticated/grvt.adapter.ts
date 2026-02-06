import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface GrvtInstrument {
  instrument: string;
  fundingRate: string;
  nextFundingTimestamp: string;
  markPrice: string;
  indexPrice: string;
  openInterest: string;
}

interface GrvtResponse {
  result: GrvtInstrument[];
}

export class GrvtAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://api.grvt.io/v1/funding';

  constructor(config: AdapterConfig = {}) {
    super('grvt', config);
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async fetchFundingRates(): Promise<FetchResult> {
    if (!this.isConfigured()) {
      return this.errorResult('API key not configured');
    }

    try {
      const response = await this.safeFetch<GrvtResponse>(this.apiUrl, {
        headers: {
          'Cookie': `session=${this.config.apiKey}`,
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      if (!response.data.result) {
        return this.errorResult('Invalid response format');
      }

      const rates: FundingRate[] = response.data.result.map((item) => {
        const fundingRate = parseFloat(item.fundingRate || '0');

        return this.createFundingRate({
          rawSymbol: item.instrument,
          fundingRate,
          markPrice: parseFloat(item.markPrice),
          indexPrice: parseFloat(item.indexPrice),
          openInterest: parseFloat(item.openInterest),
          nextFundingTime: item.nextFundingTimestamp
            ? new Date(parseInt(item.nextFundingTimestamp))
            : undefined,
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
