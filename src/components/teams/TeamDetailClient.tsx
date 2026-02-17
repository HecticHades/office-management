'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteTeam } from '@/actions/teams';
import type { Team, TeamMember, User } from '@/lib/db/types';
import { MemberList } from './MemberList';
import { AddMemberDialog } from './AddMemberDialog';
import { TeamForm } from './TeamForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, Users, Pencil, Loader2 } from 'lucide-react';
import Link from 'next/link';

type TeamWithMembers = Team & {
  members: (TeamMember & {
    user: Pick<User, 'id' | 'username' | 'display_name' | 'role'>;
  })[];
};

type TeamDetailClientProps = {
  team: TeamWithMembers;
  isAdmin: boolean;
};

export function TeamDetailClient({ team, isAdmin }: TeamDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTeam(team.id);
      if (result.success) {
        toast.success('Team deleted');
        router.push('/teams');
      } else {
        toast.error(result.error ?? 'Failed to delete team');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="size-4 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">{team.name}</h1>
          </div>
          {team.description && (
            <p className="text-stone-500 mt-1 ml-7">
              {team.description}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <TeamForm
              team={team}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-4" />
                  Edit
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{' '}
                    <strong>{team.name}</strong>? This will remove all team
                    member associations. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Team'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-stone-800">
            <Users className="size-5 text-stone-500" />
            Members
            <Badge variant="secondary" className="rounded-full bg-stone-100 text-stone-600">{team.members.length}</Badge>
          </CardTitle>
          {isAdmin && <AddMemberDialog teamId={team.id} />}
        </CardHeader>
        <CardContent>
          <MemberList teamId={team.id} members={team.members} />
        </CardContent>
      </Card>
    </div>
  );
}
