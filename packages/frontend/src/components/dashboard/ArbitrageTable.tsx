'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useArbitrage } from '@/hooks/useFundingRates';
import { formatAnnualizedRate } from '@/lib/utils';
import { EXCHANGES } from '@funding-dashboard/shared';
import { ArrowRight, Zap } from 'lucide-react';

export function ArbitrageTable() {
  const { data, isLoading } = useArbitrage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Arbitrage Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const opportunities = data?.opportunities || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Arbitrage Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No significant arbitrage opportunities found
          </p>
        ) : (
          <div className="space-y-3">
            {opportunities.slice(0, 5).map((opp, idx) => (
              <div
                key={`${opp.symbol}-${idx}`}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">{opp.symbol}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Long on{' '}
                      <span className="text-foreground">
                        {EXCHANGES[opp.longExchange].name}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Short on{' '}
                      <span className="text-foreground">
                        {EXCHANGES[opp.shortExchange].name}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    {formatAnnualizedRate(opp.spreadAnnualized)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Annual Spread
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
