'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { removeMember, updateMemberRole } from '@/actions/team-members';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { TeamMember, User } from '@/lib/db/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Crown, UserMinus, ArrowUpDown } from 'lucide-react';

type MemberWithUser = TeamMember & {
  user: Pick<User, 'id' | 'username' | 'display_name' | 'role'>;
};

type MemberListProps = {
  teamId: string;
  members: MemberWithUser[];
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MemberList({ teamId, members: initialMembers }: MemberListProps) {
  const [members, setMembers] = useState(initialMembers);
  const [isPending, startTransition] = useTransition();
  const { isAdmin, canManageTeam } = usePermissions();

  // Sort: leads first, then by display name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'lead' && b.role !== 'lead') return -1;
    if (a.role !== 'lead' && b.role === 'lead') return 1;
    return a.user.display_name.localeCompare(b.user.display_name);
  });

  function handleRemove(member: MemberWithUser) {
    startTransition(async () => {
      const result = await removeMember(teamId, member.user_id);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast.success(`${member.user.display_name} removed from team`);
      } else {
        toast.error(result.error ?? 'Failed to remove member');
      }
    });
  }

  function handleToggleRole(member: MemberWithUser) {
    const newRole = member.role === 'lead' ? 'member' : 'lead';
    startTransition(async () => {
      const result = await updateMemberRole(member.id, newRole);
      if (result.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
        );
        toast.success(
          `${member.user.display_name} is now a ${newRole === 'lead' ? 'team lead' : 'member'}`
        );
      } else {
        toast.error(result.error ?? 'Failed to update role');
      }
    });
  }

  if (sortedMembers.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No members in this team yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Team Role</TableHead>
            {canManageTeam && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.user.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {member.user.display_name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {member.user.username}
              </TableCell>
              <TableCell>
                {member.role === 'lead' ? (
                  <Badge className="gap-1 bg-amber-500/15 text-amber-600 border-amber-500/20">
                    <Crown className="size-3" />
                    Lead
                  </Badge>
                ) : (
                  <Badge variant="outline">Member</Badge>
                )}
              </TableCell>
              {canManageTeam && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleToggleRole(member)}
                        disabled={isPending}
                        title={
                          member.role === 'lead'
                            ? 'Demote to member'
                            : 'Promote to lead'
                        }
                      >
                        <ArrowUpDown className="size-3" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={isPending}
                          title="Remove from team"
                        >
                          <UserMinus className="size-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove{' '}
                            <strong>{member.user.display_name}</strong> from this
                            team?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleRemove(member)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
