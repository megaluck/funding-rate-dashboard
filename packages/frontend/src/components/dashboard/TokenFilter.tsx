'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface TokenFilterProps {
  search: string;
  onChange: (search: string) => void;
}

export function TokenFilter({ search, onChange }: TokenFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search tokens (e.g., BTC, ETH)..."
        value={search}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {search && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
