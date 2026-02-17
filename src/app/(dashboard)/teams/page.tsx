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
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">Teams</h1>
          <p className="text-stone-500 mt-1">
            Manage teams and their members.
          </p>
        </div>
        {session.user.role === 'admin' && <TeamForm />}
      </div>

      {teams.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-stone-100">
            <Users className="size-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700">No teams yet</h3>
          <p className="mt-1 text-sm text-stone-500">
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
