import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface DydxMarket {
  clobPairId: string;
  ticker: string;
  status: string;
  oraclePrice: string;
  priceChange24H: string;
  volume24H: string;
  trades24H: number;
  nextFundingRate: string;
  initialMarginFraction: string;
  maintenanceMarginFraction: string;
  openInterest: string;
  atomicResolution: number;
  quantumConversionExponent: number;
  tickSize: string;
  stepSize: string;
  stepBaseQuantums: number;
  subticksPerTick: number;
}

interface DydxMarketsResponse {
  markets: Record<string, DydxMarket>;
}

export class DydxV4Adapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://indexer.v4mainnet.dydx.exchange/v4/perpetualMarkets';

  constructor(config: AdapterConfig = {}) {
    super('dydx', config);
  }

  async fetchFundingRates(): Promise<FetchResult> {
    try {
      const response = await this.safeFetch<DydxMarketsResponse>(this.apiUrl);

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      const rates: FundingRate[] = [];

      for (const [, market] of Object.entries(response.data.markets)) {
        if (market.status !== 'ACTIVE') continue;

        const fundingRate = parseFloat(market.nextFundingRate || '0');

        rates.push(
          this.createFundingRate({
            rawSymbol: market.ticker,
            fundingRate,
            indexPrice: parseFloat(market.oraclePrice),
            openInterest: parseFloat(market.openInterest),
            volume24h: parseFloat(market.volume24H),
          })
        );
      }

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
