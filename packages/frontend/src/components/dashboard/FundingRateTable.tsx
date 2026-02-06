'use client';

import { useFundingRates } from '@/hooks/useFundingRates';
import { formatAnnualizedRate, formatRate, formatPrice, getRateColorClass, getTimeAgo } from '@/lib/utils';
import { EXCHANGES, type ExchangeId, type FundingRate } from '@funding-dashboard/shared';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface FundingRateTableProps {
  exchanges: ExchangeId[];
  search: string;
}

type SortField = 'symbol' | 'exchange' | 'fundingRate' | 'fundingRateAnnualized' | 'markPrice';
type SortOrder = 'asc' | 'desc';

export function FundingRateTable({ exchanges, search }: FundingRateTableProps) {
  const [sortField, setSortField] = useState<SortField>('fundingRateAnnualized');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data, isLoading, error } = useFundingRates({
    exchanges: exchanges.length > 0 ? exchanges : undefined,
    search: search || undefined,
    sortBy: sortField === 'markPrice' ? 'fundingRateAnnualized' : sortField,
    sortOrder,
    limit: 200,
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="funding-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Exchange</th>
                <th>Funding Rate</th>
                <th>Annualized</th>
                <th>Mark Price</th>
                <th>Interval</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j}>
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load funding rates</p>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure the backend server is running
        </p>
      </div>
    );
  }

  const rates = data?.rates || [];

  // Client-side sort for markPrice since API doesn't support it
  if (sortField === 'markPrice') {
    rates.sort((a, b) => {
      const aVal = a.markPrice || 0;
      const bVal = b.markPrice || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto max-h-[600px]">
        <table className="funding-table">
          <thead>
            <tr>
              <th>
                <button
                  onClick={() => handleSort('symbol')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Symbol <SortIcon field="symbol" />
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('exchange')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Exchange <SortIcon field="exchange" />
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('fundingRate')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Funding Rate <SortIcon field="fundingRate" />
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('fundingRateAnnualized')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Annualized <SortIcon field="fundingRateAnnualized" />
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('markPrice')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Mark Price <SortIcon field="markPrice" />
                </button>
              </th>
              <th>Interval</th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted-foreground py-8">
                  No funding rates found
                </td>
              </tr>
            ) : (
              rates.map((rate, idx) => (
                <FundingRateRow key={`${rate.exchange}-${rate.symbol}-${idx}`} rate={rate} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {data?.pagination && (
        <div className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
          Showing {rates.length} of {data.pagination.total} rates
          {data.lastUpdated && (
            <span className="ml-2">
              · Updated {getTimeAgo(data.lastUpdated)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FundingRateRow({ rate }: { rate: FundingRate }) {
  const exchange = EXCHANGES[rate.exchange];

  return (
    <tr>
      <td>
        <span className="font-medium">{rate.symbol}</span>
      </td>
      <td>
        <a
          href={exchange.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-muted-foreground hover:text-primary"
        >
          {exchange.name}
          <ExternalLink className="h-3 w-3" />
        </a>
      </td>
      <td className={getRateColorClass(rate.fundingRate)}>
        {formatRate(rate.fundingRate)}
      </td>
      <td className={getRateColorClass(rate.fundingRateAnnualized)}>
        <span className="font-medium">
          {formatAnnualizedRate(rate.fundingRateAnnualized)}
        </span>
      </td>
      <td className="text-muted-foreground">
        {rate.markPrice ? `$${formatPrice(rate.markPrice)}` : '--'}
      </td>
      <td className="text-muted-foreground">
        {rate.fundingInterval}h
      </td>
    </tr>
  );
}
