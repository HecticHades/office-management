'use client';

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type OccupancyChartProps = {
  data: { date: string; occupancy: number }[];
};

export function OccupancyChart({ data }: OccupancyChartProps) {
  if (data.length === 0) {
    return (
      <Card className="rounded-xl border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-medium">Weekly Occupancy</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No occupancy data available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-medium">Weekly Occupancy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#99f6e4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#99f6e4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Occupancy']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="occupancy"
                stroke="#0d9488"
                strokeWidth={2}
                fill="url(#occupancyGradient)"
                dot={{ r: 4, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#0d9488' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
