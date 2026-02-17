import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { RecentBookings } from '@/components/dashboard/RecentBookings';
import { TeamDistribution } from '@/components/dashboard/TeamDistribution';

async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  const [usersResult, teamsResult, desksResult, todayBookingsResult] = await Promise.all([
    db.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('teams').select('id', { count: 'exact', head: true }),
    db.from('desks').select('id, status'),
    db.from('bookings').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'confirmed'),
  ]);

  const totalUsers = usersResult.count || 0;
  const activeTeams = teamsResult.count || 0;
  const allDesks = desksResult.data || [];
  const totalDesks = allDesks.length;
  const availableDesks = allDesks.filter((d: { status: string }) => d.status === 'available').length;
  const todayBookings = todayBookingsResult.count || 0;
  const occupancyRate = totalDesks > 0 ? Math.round((todayBookings / totalDesks) * 100) : 0;

  return { totalUsers, activeTeams, availableDesks, todayBookings, occupancyRate };
}

async function getOccupancyData() {
  const totalDesksResult = await db.from('desks').select('id', { count: 'exact', head: true });
  const totalDesks = totalDesksResult.count || 0;

  if (totalDesks === 0) return [];

  const days: { date: string; occupancy: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const { count } = await db
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('date', dateStr)
      .eq('status', 'confirmed');

    days.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      occupancy: Math.round(((count || 0) / totalDesks) * 100),
    });
  }

  return days;
}

async function getRecentBookingsData() {
  const { data: bookings } = await db
    .from('bookings')
    .select('id, date, time_slot, desks:desk_id(id, label, zones:zone_id(name)), users:user_id(id, display_name)')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(10);

  return (bookings || []).map((b: Record<string, unknown>) => {
    const desk = b.desks as Record<string, unknown> | null;
    const user = b.users as Record<string, unknown> | null;
    const zone = desk?.zones as Record<string, unknown> | null;
    return {
      id: b.id as string,
      userName: (user?.display_name as string) || 'Unknown',
      deskLabel: (desk?.label as string) || 'Unknown',
      zoneName: (zone?.name as string) || 'Unknown',
      date: b.date as string,
      timeSlot: b.time_slot as string,
    };
  });
}

async function getTeamDistributionData() {
  const { data: teams } = await db
    .from('teams')
    .select('id, name, color');

  if (!teams || teams.length === 0) return [];

  const teamIds = teams.map((t: { id: string }) => t.id);
  const { data: members } = await db
    .from('team_members')
    .select('team_id')
    .in('team_id', teamIds);

  const memberCounts: Record<string, number> = {};
  for (const m of members || []) {
    memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
  }

  return teams.map((t: { id: string; name: string; color: string }) => ({
    name: t.name,
    members: memberCounts[t.id] || 0,
    color: t.color,
  }));
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [stats, occupancyData, recentBookings, teamDistribution] = await Promise.all([
    getDashboardStats(),
    getOccupancyData(),
    getRecentBookingsData(),
    getTeamDistributionData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.display_name}.
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OccupancyChart data={occupancyData} />
        <TeamDistribution teams={teamDistribution} />
      </div>

      <RecentBookings bookings={recentBookings} />
    </div>
  );
}
