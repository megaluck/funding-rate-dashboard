import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface MyxContract {
  symbol: string;
  indexPrice: string;
  markPrice: string;
  fundingRate: string;
  nextFundingTime: number;
  openInterest: string;
  volume24h: string;
}

interface MyxResponse {
  code: number;
  data: {
    contracts: MyxContract[];
  };
}

export class MyxAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://api.myx.finance/v2/quote/market/contracts';

  constructor(config: AdapterConfig = {}) {
    super('myx', config);
  }

  async fetchFundingRates(): Promise<FetchResult> {
    try {
      const response = await this.safeFetch<MyxResponse>(this.apiUrl);

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      if (response.data.code !== 0 || !response.data.data?.contracts) {
        return this.errorResult('Invalid response format');
      }

      const rates: FundingRate[] = response.data.data.contracts.map((contract) => {
        const fundingRate = parseFloat(contract.fundingRate || '0');

        return this.createFundingRate({
          rawSymbol: contract.symbol,
          fundingRate,
          markPrice: parseFloat(contract.markPrice),
          indexPrice: parseFloat(contract.indexPrice),
          openInterest: parseFloat(contract.openInterest),
          volume24h: parseFloat(contract.volume24h),
          nextFundingTime: contract.nextFundingTime ? new Date(contract.nextFundingTime) : undefined,
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
