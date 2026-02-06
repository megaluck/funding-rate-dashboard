import type { FastifyPluginAsync } from 'fastify';
import type { ExchangeId, TimeRange } from '@funding-dashboard/shared';
import { EXCHANGES, EXCHANGE_IDS } from '@funding-dashboard/shared';
import { aggregatorService } from '../services/aggregator.service.js';

interface CurrentRatesQuery {
  exchanges?: string;
  symbols?: string;
  search?: string;
  minRate?: string;
  maxRate?: string;
  sortBy?: 'fundingRate' | 'fundingRateAnnualized' | 'symbol' | 'exchange';
  sortOrder?: 'asc' | 'desc';
  page?: string;
  limit?: string;
  refresh?: string;
}

interface HistoricalQuery {
  symbol: string;
  exchanges?: string;
  range?: TimeRange;
}

export const fundingRatesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current funding rates
  fastify.get<{ Querystring: CurrentRatesQuery }>(
    '/current',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            exchanges: { type: 'string' },
            symbols: { type: 'string' },
            search: { type: 'string' },
            minRate: { type: 'string' },
            maxRate: { type: 'string' },
            sortBy: {
              type: 'string',
              enum: ['fundingRate', 'fundingRateAnnualized', 'symbol', 'exchange'],
            },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
            page: { type: 'string' },
            limit: { type: 'string' },
            refresh: { type: 'string' },
          },
        },
      },
    },
    async (request) => {
      const {
        exchanges,
        symbols,
        search,
        minRate,
        maxRate,
        sortBy = 'fundingRateAnnualized',
        sortOrder = 'desc',
        page = '1',
        limit = '100',
        refresh,
      } = request.query;

      const forceRefresh = refresh === 'true';
      const response = await aggregatorService.getCurrentRates(forceRefresh);

      let rates = response.rates;

      // Filter by exchanges
      if (exchanges) {
        const exchangeList = exchanges.split(',') as ExchangeId[];
        rates = rates.filter((r) => exchangeList.includes(r.exchange));
      }

      // Filter by symbols
      if (symbols) {
        const symbolList = symbols.split(',').map((s) => s.toUpperCase());
        rates = rates.filter((r) => symbolList.includes(r.symbol.toUpperCase()));
      }

      // Search by symbol
      if (search) {
        const searchTerm = search.toUpperCase();
        rates = rates.filter((r) => r.symbol.toUpperCase().includes(searchTerm));
      }

      // Filter by rate range
      if (minRate) {
        const min = parseFloat(minRate);
        rates = rates.filter((r) => r.fundingRateAnnualized >= min);
      }
      if (maxRate) {
        const max = parseFloat(maxRate);
        rates = rates.filter((r) => r.fundingRateAnnualized <= max);
      }

      // Sort
      rates.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'fundingRate':
            comparison = a.fundingRate - b.fundingRate;
            break;
          case 'fundingRateAnnualized':
            comparison = a.fundingRateAnnualized - b.fundingRateAnnualized;
            break;
          case 'symbol':
            comparison = a.symbol.localeCompare(b.symbol);
            break;
          case 'exchange':
            comparison = a.exchange.localeCompare(b.exchange);
            break;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Paginate
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const total = rates.length;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedRates = rates.slice(startIndex, startIndex + limitNum);

      return {
        success: true,
        data: {
          rates: paginatedRates,
          lastUpdated: response.lastUpdated,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        timestamp: new Date().toISOString(),
      };
    }
  );

  // Get historical funding rates
  fastify.get<{ Querystring: HistoricalQuery }>(
    '/historical',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string' },
            exchanges: { type: 'string' },
            range: {
              type: 'string',
              enum: ['1h', '4h', '24h', '7d', '30d'],
            },
          },
        },
      },
    },
    async (request) => {
      const { symbol, exchanges, range = '24h' } = request.query;

      const rangeHours: Record<TimeRange, number> = {
        '1h': 1,
        '4h': 4,
        '24h': 24,
        '7d': 168,
        '30d': 720,
      };

      const exchangeIds = exchanges
        ? (exchanges.split(',') as ExchangeId[])
        : undefined;

      const rates = await aggregatorService.getHistoricalRates(
        symbol.toUpperCase(),
        exchangeIds,
        rangeHours[range]
      );

      return {
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          range,
          rates,
        },
        timestamp: new Date().toISOString(),
      };
    }
  );

  // Get summary statistics
  fastify.get('/summary', async () => {
    const summary = await aggregatorService.getSummary();

    return {
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    };
  });

  // Get arbitrage opportunities
  fastify.get('/arbitrage', async () => {
    const summary = await aggregatorService.getSummary();

    return {
      success: true,
      data: {
        opportunities: summary.topArbitrage,
      },
      timestamp: new Date().toISOString(),
    };
  });

  // Get comparison for a symbol across exchanges
  fastify.get<{ Params: { symbol: string } }>(
    '/comparison/:symbol',
    {
      schema: {
        params: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string' },
          },
        },
      },
    },
    async (request) => {
      const { symbol } = request.params;
      const response = await aggregatorService.getCurrentRates();

      const rates = response.rates.filter(
        (r) => r.symbol.toUpperCase() === symbol.toUpperCase()
      );

      rates.sort((a, b) => b.fundingRateAnnualized - a.fundingRateAnnualized);

      return {
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          rates,
          spread:
            rates.length >= 2
              ? rates[0].fundingRateAnnualized -
                rates[rates.length - 1].fundingRateAnnualized
              : 0,
        },
        timestamp: new Date().toISOString(),
      };
    }
  );
};

export const exchangesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all exchanges
  fastify.get('/', async () => {
    const statuses = await aggregatorService.getExchangeStatuses();

    const exchanges = EXCHANGE_IDS.map((id) => {
      const exchange = EXCHANGES[id];
      const status = statuses.find((s) => s.id === id);

      return {
        ...exchange,
        status: status?.error ? 'error' : status?.enabled ? 'ok' : 'disabled',
        lastFetchTime: status?.lastFetchTime,
        rateCount: status?.rateCount || 0,
        error: status?.error,
      };
    });

    return {
      success: true,
      data: { exchanges },
      timestamp: new Date().toISOString(),
    };
  });

  // Get specific exchange details
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      if (!EXCHANGE_IDS.includes(id as ExchangeId)) {
        return reply.status(404).send({
          success: false,
          error: 'Exchange not found',
        });
      }

      const exchange = EXCHANGES[id as ExchangeId];
      const statuses = await aggregatorService.getExchangeStatuses();
      const status = statuses.find((s) => s.id === id);
      const response = await aggregatorService.getCurrentRates();
      const rates = response.rates.filter((r) => r.exchange === id);

      return {
        success: true,
        data: {
          ...exchange,
          status: status?.error ? 'error' : status?.enabled ? 'ok' : 'disabled',
          lastFetchTime: status?.lastFetchTime,
          rateCount: rates.length,
          error: status?.error,
          rates,
        },
        timestamp: new Date().toISOString(),
      };
    }
  );
};
