import { ExchangeAdapter, type FetchResult, type AdapterConfig } from '../base/exchange-adapter.js';
import type { FundingRate } from '@funding-dashboard/shared';
import WebSocket from 'ws';

interface ParadexFundingData {
  symbol: string;
  funding_rate: string;
  funding_premium: string;
  funding_rate_8h: string;
  mark_price: string;
  index_price: string;
  open_interest: string;
  last_funding_at: string;
  next_funding_at: string;
}

interface ParadexMessage {
  channel: string;
  type: string;
  data?: ParadexFundingData[];
  error?: { code: number; message: string };
}

export class ParadexAdapter extends ExchangeAdapter {
  private readonly wsUrl = 'wss://ws.api.prod.paradex.trade/v1';
  private readonly restUrl = 'https://api.prod.paradex.trade/v1';

  constructor(config: AdapterConfig = {}) {
    super('paradex', config);
  }

  async fetchFundingRates(): Promise<FetchResult> {
    // Try REST API first for simplicity
    try {
      const response = await this.safeFetch<{ results: ParadexFundingData[] }>(
        `${this.restUrl}/markets/summary`
      );

      if (response.error || !response.data) {
        // Fall back to WebSocket
        return this.fetchViaWebSocket();
      }

      const rates: FundingRate[] = response.data.results.map((item) => {
        // Paradex provides 8h funding rate directly
        const fundingRate8h = parseFloat(item.funding_rate_8h || item.funding_rate || '0');

        return this.createFundingRate({
          rawSymbol: item.symbol,
          fundingRate: fundingRate8h,
          markPrice: parseFloat(item.mark_price),
          indexPrice: parseFloat(item.index_price),
          openInterest: parseFloat(item.open_interest),
          nextFundingTime: item.next_funding_at ? new Date(item.next_funding_at) : undefined,
        });
      });

      return this.successResult(rates);
    } catch (err) {
      return this.errorResult(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  private async fetchViaWebSocket(): Promise<FetchResult> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(this.errorResult('WebSocket timeout'));
      }, 10000);

      try {
        const ws = new WebSocket(this.wsUrl);
        let dataReceived = false;

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'funding_data',
          }));
        });

        ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString()) as ParadexMessage;

            if (message.type === 'snapshot' && message.data) {
              dataReceived = true;
              clearTimeout(timeout);

              const rates: FundingRate[] = message.data.map((item) => {
                const fundingRate = parseFloat(item.funding_rate || '0');

                return this.createFundingRate({
                  rawSymbol: item.symbol,
                  fundingRate,
                  markPrice: parseFloat(item.mark_price),
                  indexPrice: parseFloat(item.index_price),
                  openInterest: parseFloat(item.open_interest),
                  nextFundingTime: item.next_funding_at ? new Date(item.next_funding_at) : undefined,
                });
              });

              ws.close();
              resolve(this.successResult(rates));
            }
          } catch {
            // Ignore parse errors
          }
        });

        ws.on('error', (err) => {
          if (!dataReceived) {
            clearTimeout(timeout);
            resolve(this.errorResult(`WebSocket error: ${err.message}`));
          }
        });

        ws.on('close', () => {
          if (!dataReceived) {
            clearTimeout(timeout);
            resolve(this.errorResult('WebSocket closed without data'));
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        resolve(this.errorResult(err instanceof Error ? err.message : 'Unknown error'));
      }
    });
  }
}
