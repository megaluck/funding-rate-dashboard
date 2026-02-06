import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface HyperliquidFundingResponse {
  coin: string;
  funding: string;
  premium: string;
  time: number;
}

interface HyperliquidMetaResponse {
  universe: {
    name: string;
    szDecimals: number;
    maxLeverage: number;
  }[];
}

interface HyperliquidAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string;
  oraclePx: string;
  markPx: string;
  midPx: string;
  impactPxs: string[];
}

export class HyperliquidAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://api.hyperliquid.xyz/info';

  constructor(config: AdapterConfig = {}) {
    super('hyperliquid', config);
  }

  async fetchFundingRates(): Promise<FetchResult> {
    try {
      // Fetch predicted fundings
      const fundingResponse = await this.safeFetch<HyperliquidFundingResponse[]>(
        this.apiUrl,
        {
          method: 'POST',
          body: JSON.stringify({ type: 'predictedFundings' }),
        }
      );

      if (fundingResponse.error || !fundingResponse.data) {
        return this.errorResult(fundingResponse.error || 'No data received');
      }

      // Fetch meta and asset contexts for additional data
      const metaResponse = await this.safeFetch<[HyperliquidMetaResponse, HyperliquidAssetCtx[]]>(
        this.apiUrl,
        {
          method: 'POST',
          body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
        }
      );

      const assetCtxMap = new Map<string, HyperliquidAssetCtx>();
      if (metaResponse.data) {
        const [meta, assetCtxs] = metaResponse.data;
        meta.universe.forEach((asset, index) => {
          if (assetCtxs[index]) {
            assetCtxMap.set(asset.name, assetCtxs[index]);
          }
        });
      }

      const rates: FundingRate[] = fundingResponse.data.map((item) => {
        const assetCtx = assetCtxMap.get(item.coin);
        const fundingRate = parseFloat(item.funding);

        return this.createFundingRate({
          rawSymbol: item.coin,
          fundingRate,
          markPrice: assetCtx ? parseFloat(assetCtx.markPx) : undefined,
          indexPrice: assetCtx ? parseFloat(assetCtx.oraclePx) : undefined,
          openInterest: assetCtx ? parseFloat(assetCtx.openInterest) : undefined,
          volume24h: assetCtx ? parseFloat(assetCtx.dayNtlVlm) : undefined,
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
