import { Card, CardContent } from '@/components/ui/card';
import { Users, Building2, Monitor, Calendar, TrendingUp } from 'lucide-react';

type StatsCardsProps = {
  stats: {
    totalUsers: number;
    activeTeams: number;
    availableDesks: number;
    todayBookings: number;
    occupancyRate: number;
  };
};

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Teams',
      value: stats.activeTeams,
      icon: Building2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Available Desks',
      value: stats.availableDesks,
      icon: Monitor,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: "Today's Bookings",
      value: stats.todayBookings,
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-2.5 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
