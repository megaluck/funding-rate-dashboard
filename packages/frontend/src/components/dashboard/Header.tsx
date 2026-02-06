'use client';

import { Badge } from '@/components/ui/badge';
import { useExchanges } from '@/hooks/useFundingRates';
import { Activity, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function Header() {
  const { data: exchangeData } = useExchanges();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeExchanges = exchangeData?.exchanges.filter(
    (e) => e.status === 'ok'
  ).length || 0;
  const totalExchanges = exchangeData?.exchanges.length || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Funding Rate Dashboard</h1>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex">
              Perp DEX Aggregator
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeExchanges > 0 ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              {activeExchanges}/{totalExchanges} exchanges
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
