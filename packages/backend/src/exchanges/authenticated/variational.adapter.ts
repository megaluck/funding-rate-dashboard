import { createHmac } from 'crypto';
import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface VariationalMarket {
  symbol: string;
  fundingRate: string;
  markPrice: string;
  indexPrice: string;
  openInterest: string;
  nextFundingTime: string;
}

interface VariationalResponse {
  data: VariationalMarket[];
}

export class VariationalAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://api.variational.io/v1/markets';

  constructor(config: AdapterConfig = {}) {
    super('variational', config);
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret);
  }

  private generateSignature(timestamp: string, method: string, path: string): string {
    const message = `${timestamp}${method}${path}`;
    return createHmac('sha256', this.config.apiSecret!)
      .update(message)
      .digest('hex');
  }

  async fetchFundingRates(): Promise<FetchResult> {
    if (!this.isConfigured()) {
      return this.errorResult('API key/secret not configured');
    }

    try {
      const timestamp = Date.now().toString();
      const path = '/v1/markets';
      const signature = this.generateSignature(timestamp, 'GET', path);

      const response = await this.safeFetch<VariationalResponse>(this.apiUrl, {
        headers: {
          'X-API-Key': this.config.apiKey!,
          'X-Timestamp': timestamp,
          'X-Signature': signature,
        },
      });

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      const rates: FundingRate[] = response.data.data.map((item) => {
        const fundingRate = parseFloat(item.fundingRate || '0');

        return this.createFundingRate({
          rawSymbol: item.symbol,
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
