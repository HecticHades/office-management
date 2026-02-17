'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TeamData = {
  name: string;
  members: number;
  color: string;
};

type TeamDistributionProps = {
  teams: TeamData[];
};

export function TeamDistribution({ teams }: TeamDistributionProps) {
  if (teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Distribution</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No teams created yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teams} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                formatter={(value) => [value, 'Members']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                }}
              />
              <Bar dataKey="members" radius={[0, 4, 4, 0]} barSize={24}>
                {teams.map((team, index) => (
                  <Cell key={index} fill={team.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
