'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSummary } from '@/hooks/useFundingRates';
import { formatAnnualizedRate, getRateColorClass } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart2, Zap } from 'lucide-react';
import { EXCHANGES } from '@funding-dashboard/shared';

export function SummaryCards() {
  const { data: summary, isLoading } = useSummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Highest Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Highest Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          {summary.highestRate ? (
            <>
              <div
                className={`text-2xl font-bold ${getRateColorClass(
                  summary.highestRate.fundingRateAnnualized
                )}`}
              >
                {formatAnnualizedRate(summary.highestRate.fundingRateAnnualized)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.highestRate.symbol} on{' '}
                {EXCHANGES[summary.highestRate.exchange].name}
              </p>
            </>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">--</div>
          )}
        </CardContent>
      </Card>

      {/* Lowest Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lowest Rate
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          {summary.lowestRate ? (
            <>
              <div
                className={`text-2xl font-bold ${getRateColorClass(
                  summary.lowestRate.fundingRateAnnualized
                )}`}
              >
                {formatAnnualizedRate(summary.lowestRate.fundingRateAnnualized)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.lowestRate.symbol} on{' '}
                {EXCHANGES[summary.lowestRate.exchange].name}
              </p>
            </>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">--</div>
          )}
        </CardContent>
      </Card>

      {/* Total Markets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Markets
          </CardTitle>
          <BarChart2 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalMarkets}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all exchanges
          </p>
        </CardContent>
      </Card>

      {/* Top Arbitrage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Best Arbitrage
          </CardTitle>
          <Zap className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          {summary.topArbitrage.length > 0 ? (
            <>
              <div className="text-2xl font-bold text-green-400">
                {formatAnnualizedRate(summary.topArbitrage[0].spreadAnnualized)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.topArbitrage[0].symbol} spread
              </p>
            </>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">--</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
