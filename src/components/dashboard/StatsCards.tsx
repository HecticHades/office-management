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
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'Active Teams',
      value: stats.activeTeams,
      icon: Building2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Available Desks',
      value: stats.availableDesks,
      icon: Monitor,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
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
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      isOccupancy: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl border-stone-200 shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                <p className="text-sm text-muted-foreground tracking-wide uppercase">{card.label}</p>
              </div>
            </div>
            {'isOccupancy' in card && card.isOccupancy && (
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-stone-100">
                  <div
                    className="h-1.5 rounded-full bg-violet-500 transition-all"
                    style={{ width: `${stats.occupancyRate}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
