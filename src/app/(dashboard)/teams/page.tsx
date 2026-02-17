import { getSession } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { getTeams } from '@/actions/teams';
import { TeamCard } from '@/components/teams/TeamCard';
import { TeamForm } from '@/components/teams/TeamForm';
import { Users } from 'lucide-react';

export default async function TeamsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { teams } = await getTeams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage teams and their members.
          </p>
        </div>
        {session.user.role === 'admin' && <TeamForm />}
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <Users className="mx-auto size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.user.role === 'admin'
              ? 'Create your first team to get started.'
              : 'No teams have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
