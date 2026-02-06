/**
 * Calculate annualized funding rate from periodic rate
 * @param rate - The funding rate as a decimal (e.g., 0.0001 for 0.01%)
 * @param intervalHours - The funding interval in hours
 * @returns Annualized rate as a decimal
 */
export function annualizeFundingRate(rate: number, intervalHours: number): number {
  const periodsPerYear = (365 * 24) / intervalHours;
  return rate * periodsPerYear;
}

/**
 * Convert annualized rate to periodic rate
 * @param annualizedRate - The annualized rate as a decimal
 * @param intervalHours - The funding interval in hours
 * @returns Periodic rate as a decimal
 */
export function deannualizeFundingRate(annualizedRate: number, intervalHours: number): number {
  const periodsPerYear = (365 * 24) / intervalHours;
  return annualizedRate / periodsPerYear;
}

/**
 * Format funding rate as percentage string
 * @param rate - Rate as decimal
 * @param decimals - Number of decimal places
 * @returns Formatted string like "0.0100%"
 */
export function formatFundingRate(rate: number, decimals = 4): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

/**
 * Format annualized rate as percentage string
 * @param rate - Annualized rate as decimal
 * @returns Formatted string like "36.50%"
 */
export function formatAnnualizedRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Normalize a trading symbol to standard format (BASE-QUOTE)
 * Examples:
 *   BTC-USD-PERP -> BTC-USD
 *   BTCUSD -> BTC-USD
 *   BTC/USD:USD -> BTC-USD
 *   BTC-PERP -> BTC-USD
 */
export function normalizeSymbol(rawSymbol: string): string {
  // Remove common suffixes
  let symbol = rawSymbol.toUpperCase();
  symbol = symbol.replace(/-PERP$/i, '');
  symbol = symbol.replace(/_PERP$/i, '');
  symbol = symbol.replace(/PERP$/i, '');
  symbol = symbol.replace(/:USD$/i, '');
  symbol = symbol.replace(/\/USD$/i, '-USD');

  // Handle concatenated symbols (BTCUSD -> BTC-USD)
  if (!symbol.includes('-') && !symbol.includes('/')) {
    // Common quote currencies
    const quotes = ['USDT', 'USDC', 'USD', 'BUSD', 'DAI'];
    for (const quote of quotes) {
      if (symbol.endsWith(quote)) {
        const base = symbol.slice(0, -quote.length);
        if (base.length >= 2) {
          symbol = `${base}-USD`;
          break;
        }
      }
    }
  }

  // Normalize separator
  symbol = symbol.replace('/', '-');

  // If no quote currency, assume USD
  if (!symbol.includes('-')) {
    symbol = `${symbol}-USD`;
  }

  // Normalize stablecoin quotes to USD
  symbol = symbol.replace(/-USDT$/, '-USD');
  symbol = symbol.replace(/-USDC$/, '-USD');
  symbol = symbol.replace(/-BUSD$/, '-USD');

  return symbol;
}

/**
 * Extract base asset from normalized symbol
 */
export function getBaseAsset(symbol: string): string {
  return symbol.split('-')[0];
}

/**
 * Extract quote asset from normalized symbol
 */
export function getQuoteAsset(symbol: string): string {
  return symbol.split('-')[1] || 'USD';
}

/**
 * Calculate time until next funding
 * @param nextFundingTime - Next funding timestamp
 * @returns Object with hours, minutes, seconds remaining
 */
export function getTimeUntilFunding(nextFundingTime: Date): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const now = new Date();
  const diff = nextFundingTime.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

/**
 * Determine rate sentiment (positive = longs pay, negative = shorts pay)
 */
export function getRateSentiment(rate: number): 'bullish' | 'bearish' | 'neutral' {
  if (rate > 0.0001) return 'bullish'; // Longs pay shorts, indicates bullish market
  if (rate < -0.0001) return 'bearish'; // Shorts pay longs, indicates bearish market
  return 'neutral';
}
