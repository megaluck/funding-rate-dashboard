'use client';

import { Badge } from '@/components/ui/badge';
import { useExchanges } from '@/hooks/useFundingRates';
import type { ExchangeId } from '@funding-dashboard/shared';
import { cn } from '@/lib/utils';

interface ExchangeFilterProps {
  selected: ExchangeId[];
  onChange: (exchanges: ExchangeId[]) => void;
}

export function ExchangeFilter({ selected, onChange }: ExchangeFilterProps) {
  const { data, isLoading } = useExchanges();

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-8 w-24 bg-muted rounded-full animate-pulse"
          />
        ))}
      </div>
    );
  }

  const exchanges = data?.exchanges || [];

  const toggleExchange = (id: ExchangeId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((e) => e !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange(exchanges.filter((e) => e.status === 'ok').map((e) => e.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Exchanges:
        </span>
        <button
          onClick={selectAll}
          className="text-xs text-primary hover:underline"
        >
          All
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          onClick={clearAll}
          className="text-xs text-primary hover:underline"
        >
          None
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {exchanges.map((exchange) => {
          const isSelected = selected.length === 0 || selected.includes(exchange.id);
          const isDisabled = exchange.status === 'disabled';

          return (
            <button
              key={exchange.id}
              onClick={() => toggleExchange(exchange.id)}
              disabled={isDisabled}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                'border border-border',
                isDisabled && 'opacity-50 cursor-not-allowed',
                isSelected && !isDisabled
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground hover:bg-secondary'
              )}
            >
              {exchange.name}
              {exchange.status === 'error' && (
                <span className="ml-1 text-red-400">!</span>
              )}
              {exchange.rateCount > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({exchange.rateCount})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
