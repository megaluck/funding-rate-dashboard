'use client';

import { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ExchangeFilter } from '@/components/dashboard/ExchangeFilter';
import { TokenFilter } from '@/components/dashboard/TokenFilter';
import { FundingRateTable } from '@/components/dashboard/FundingRateTable';
import { ArbitrageTable } from '@/components/dashboard/ArbitrageTable';
import { FundingRateChart } from '@/components/dashboard/FundingRateChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExchangeId } from '@funding-dashboard/shared';

export default function Dashboard() {
  const [selectedExchanges, setSelectedExchanges] = useState<ExchangeId[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <SummaryCards />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExchangeFilter
              selected={selectedExchanges}
              onChange={setSelectedExchanges}
            />
            <TokenFilter search={searchTerm} onChange={setSearchTerm} />
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Funding Rate Table - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Funding Rates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <FundingRateTable
                  exchanges={selectedExchanges}
                  search={searchTerm}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ArbitrageTable />

            {/* Symbol Selector for Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Compare Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD'].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => setSelectedSymbol(symbol)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        selectedSymbol === symbol
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {symbol.replace('-USD', '')}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historical Chart - Full Width */}
        <FundingRateChart symbol={selectedSymbol} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>
            Funding Rate Dashboard • Aggregating rates from 11 perpetual DEX
            exchanges
          </p>
          <p className="mt-1">
            Data refreshes every 30 seconds • Not financial advice
          </p>
        </div>
      </footer>
    </div>
  );
}
