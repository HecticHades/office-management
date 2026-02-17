import { getSession } from '@/lib/auth/middleware';
import { redirect, notFound } from 'next/navigation';
import { getTeam } from '@/actions/teams';
import { TeamDetailClient } from '@/components/teams/TeamDetailClient';

type PageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { teamId } = await params;
  const { team, error } = await getTeam(teamId);

  if (error || !team) notFound();

  return <TeamDetailClient team={team} isAdmin={session.user.role === 'admin'} />;
}
