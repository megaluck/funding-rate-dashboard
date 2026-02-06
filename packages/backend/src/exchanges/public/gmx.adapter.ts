import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';

interface GmxMarketInfo {
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  marketTokenPriceMax: string;
  marketTokenPriceMin: string;
  longTokenPriceMax: string;
  longTokenPriceMin: string;
  shortTokenPriceMax: string;
  shortTokenPriceMin: string;
  indexTokenPriceMax: string;
  indexTokenPriceMin: string;
  poolValueMax: string;
  poolValueMin: string;
  longPoolAmount: string;
  shortPoolAmount: string;
  longPoolUsd: string;
  shortPoolUsd: string;
  totalBorrowingFees: string;
  positionImpactPoolAmount: string;
  swapImpactPoolAmountLong: string;
  swapImpactPoolAmountShort: string;
  openInterestLong: string;
  openInterestShort: string;
  openInterestReserveLong: string;
  openInterestReserveShort: string;
  maxOpenInterestLong: string;
  maxOpenInterestShort: string;
  borrowingFactorLong: string;
  borrowingFactorShort: string;
  borrowingExponentFactorLong: string;
  borrowingExponentFactorShort: string;
  fundingFactor: string;
  fundingExponentFactor: string;
  fundingIncreaseFactorPerSecond: string;
  fundingDecreaseFactorPerSecond: string;
  longsPayShorts: boolean;
  fundingFactorPerSecond: string;
  fundingRateLong: string;
  fundingRateShort: string;
  virtualInventoryForPositionsLong: string;
  virtualInventoryForPositionsShort: string;
  virtualInventoryForSwapsLong: string;
  virtualInventoryForSwapsShort: string;
}

interface GmxMarketsResponse {
  markets: GmxMarketInfo[];
}

// GMX uses token addresses, we need to map them to symbols
const TOKEN_SYMBOLS: Record<string, string> = {
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'ETH',
  '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': 'BTC',
  '0xf97f4df75117a78c1a5a0dbb814af92458539fb4': 'LINK',
  '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0': 'UNI',
  '0x912ce59144191c1204e64559fe8253a0e49e6548': 'ARB',
  '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a': 'GMX',
  '0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a': 'MIM',
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': 'USDC',
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'USDT',
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'DAI',
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC',
  '0x47c031236e19d024b42f8ae6780e44a573170703': 'GM',
  '0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee': 'aUSDC',
  '0x5979d7b546e38e414f7e9822514be443a4800529': 'wstETH',
  '0x35751007a407ca6feffe80b3cb397736d2cf4dbe': 'weETH',
  '0x2416092f143378750bb29b79ed961ab195cceea5': 'ezETH',
  '0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8': 'PENDLE',
  '0x6985884c4392d348587b19cb9eaaf157f13271cd': 'ZRO',
  '0xba5ddd1f9d7f570dc94a51479a000e3bce967196': 'AAVE',
  '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42': 'MCB',
  '0x7dd9c5cba05e151c895fde1cf355c9a1d5da6429': 'ATOM',
  '0x8d9ba570d6cb60c7e3e0f31343efe75ab8e65fb1': 'NEAR',
  '0x289ba1701c2f088cf0faf8b3705246331cb8a839': 'LTC',
  '0x9623063377ad1b27544c965ccd7342f7ea7e88c7': 'XRP',
  '0x1f52145666c862ed3e2f1da213d479e61b2892af': 'DOGE',
  '0xa9004a5421372e1d83fb1f85b0fc986c912f91f3': 'SOL',
  '0x565609faf65b92f7be02468acf86f8979423e514': 'BNB',
  '0x6fdf6f9c5c09aa3fa4bc53aaadb29da6be7d9ea4': 'OP',
  '0xaed882f117a32ad47f2053ef30a16d97cfe52b42': 'ORDI',
  '0x0000000000000000000000000000000000000000': 'ETH',
  '0x4200000000000000000000000000000000000006': 'ETH',
};

export class GmxAdapter extends ExchangeAdapter {
  private readonly apiUrl = 'https://arbitrum-api.gmxinfra.io/markets/info';

  constructor(config: AdapterConfig = {}) {
    super('gmx', config);
  }

  async fetchFundingRates(): Promise<FetchResult> {
    try {
      const response = await this.safeFetch<GmxMarketsResponse>(this.apiUrl);

      if (response.error || !response.data) {
        return this.errorResult(response.error || 'No data received');
      }

      const rates: FundingRate[] = [];

      for (const market of response.data.markets) {
        // Get the index token symbol
        const indexTokenAddr = market.indexToken.toLowerCase();
        const symbol = TOKEN_SYMBOLS[indexTokenAddr] || 'UNKNOWN';

        if (symbol === 'UNKNOWN') continue;

        // GMX uses per-second funding rate, convert to hourly
        const fundingRatePerSecond = parseFloat(market.fundingFactorPerSecond || '0');
        // Convert to 1-hour rate (same as other exchanges for comparison)
        const fundingRateHourly = fundingRatePerSecond * 3600;

        // Calculate open interest
        const oiLong = parseFloat(market.openInterestLong || '0');
        const oiShort = parseFloat(market.openInterestShort || '0');
        const totalOI = oiLong + oiShort;

        // Get price
        const indexPrice = (parseFloat(market.indexTokenPriceMax) + parseFloat(market.indexTokenPriceMin)) / 2;

        rates.push(
          this.createFundingRate({
            rawSymbol: `${symbol}-USD`,
            fundingRate: fundingRateHourly,
            markPrice: indexPrice / 1e30, // GMX uses 30 decimals
            openInterest: totalOI / 1e30,
          })
        );
      }

      // Deduplicate by symbol (keep the one with higher OI)
      const deduped = new Map<string, FundingRate>();
      for (const rate of rates) {
        const existing = deduped.get(rate.symbol);
        if (!existing || (rate.openInterest || 0) > (existing.openInterest || 0)) {
          deduped.set(rate.symbol, rate);
        }
      }

      return this.successResult(Array.from(deduped.values()));
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}
