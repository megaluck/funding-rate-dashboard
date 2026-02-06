'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useHistoricalRates } from '@/hooks/useFundingRates';
import { EXCHANGES, type ExchangeId, type TimeRange } from '@funding-dashboard/shared';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
];

interface FundingRateChartProps {
  symbol?: string;
}

export function FundingRateChart({ symbol = 'BTC-USD' }: FundingRateChartProps) {
  const [range, setRange] = useState<TimeRange>('24h');
  const { data, isLoading } = useHistoricalRates(symbol, undefined, range);

  // Transform data for Recharts
  const chartData = (() => {
    if (!data?.rates) return [];

    // Group by timestamp
    const byTime = new Map<string, Record<string, number | string>>();

    for (const rate of data.rates) {
      const timeKey = new Date(rate.timestamp).toISOString();
      const existing = byTime.get(timeKey) || { time: timeKey };
      existing[rate.exchange] = rate.fundingRateAnnualized * 100; // Convert to percentage
      byTime.set(timeKey, existing);
    }

    // Sort by time
    return Array.from(byTime.values())
      .sort((a, b) => new Date(a.time as string).getTime() - new Date(b.time as string).getTime())
      .map((d) => ({
        ...d,
        time: new Date(d.time as string).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
  })();

  // Get unique exchanges from data
  const exchanges = Array.from(
    new Set(data?.rates.map((r) => r.exchange) || [])
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historical Funding Rates: {symbol}</CardTitle>
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value as TimeRange)}
          className="w-32"
        >
          <option value="1h">1 Hour</option>
          <option value="4h">4 Hours</option>
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No historical data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
              />
              <Legend />
              {exchanges.map((exchange, idx) => (
                <Line
                  key={exchange}
                  type="monotone"
                  dataKey={exchange}
                  name={EXCHANGES[exchange as ExchangeId]?.name || exchange}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
