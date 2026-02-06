import { createHmac } from 'crypto';
import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface AsterFundingRate {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  markPrice: string;
  indexPrice: string;
}

export class AsterAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://fapi.asterdex.com/fapi/v1/fundingRate';

  constructor(config: AdapterConfig = {}) {
    super('aster', config);
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret);
  }

  private generateSignature(queryString: string): string {
    return createHmac('sha256', this.config.apiSecret!)
      .update(queryString)
      .digest('hex');
  }

  async fetchFundingRates(): Promise<FetchResult> {
    if (!this.isConfigured()) {
      return this.errorResult('API key/secret not configured');
    }

    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const url = `${this.apiUrl}?${queryString}&signature=${signature}`;

      const response = await this.safeFetch<AsterFundingRate[]>(url, {
        headers: {
          'X-MBX-APIKEY': this.config.apiKey!,
        },
      });

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      const rates: FundingRate[] = response.data.map((item) => {
        const fundingRate = parseFloat(item.fundingRate || '0');

        return this.createFundingRate({
          rawSymbol: item.symbol,
          fundingRate,
          markPrice: parseFloat(item.markPrice),
          indexPrice: parseFloat(item.indexPrice),
          nextFundingTime: item.fundingTime ? new Date(item.fundingTime) : undefined,
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
