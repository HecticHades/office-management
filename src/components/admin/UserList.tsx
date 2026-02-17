'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { resetPassword, unlockAccount, toggleUserActive } from '@/actions/admin';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { formatRelative } from '@/lib/utils';
import type { User } from '@/lib/db/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  KeyRound,
  Unlock,
  UserX,
  UserCheck,
  Shield,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';

function getRoleBadge(role: User['role']) {
  switch (role) {
    case 'admin':
      return (
        <Badge variant="default" className="gap-1">
          <Shield className="size-3" />
          Admin
        </Badge>
      );
    case 'team_lead':
      return (
        <Badge variant="secondary" className="gap-1">
          <ShieldAlert className="size-3" />
          Team Lead
        </Badge>
      );
    case 'member':
      return (
        <Badge variant="outline" className="gap-1">
          <UserIcon className="size-3" />
          Member
        </Badge>
      );
  }
}

function getStatusBadge(user: User) {
  if (!user.is_active) {
    return <Badge className="rounded-full bg-stone-100 text-stone-600 border border-stone-200">Disabled</Badge>;
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return (
      <Badge className="rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        Locked
      </Badge>
    );
  }
  return (
    <Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      Active
    </Badge>
  );
}

export function UserList({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const isLocked = (user: User) =>
    user.locked_until != null && new Date(user.locked_until) > new Date();

  function handleUnlock(user: User) {
    startTransition(async () => {
      const result = await unlockAccount(user.id);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, failed_login_attempts: 0, locked_until: null }
              : u
          )
        );
        toast.success(`Account unlocked for ${user.display_name}`);
      } else {
        toast.error(result.error ?? 'Failed to unlock account');
      }
    });
  }

  function handleToggleActive(user: User) {
    const newActive = !user.is_active;
    startTransition(async () => {
      const result = await toggleUserActive(user.id, newActive);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_active: newActive } : u
          )
        );
        toast.success(
          newActive
            ? `${user.display_name} has been enabled`
            : `${user.display_name} has been disabled`
        );
      } else {
        toast.error(result.error ?? 'Failed to update user');
      }
    });
  }

  async function handleResetConfirm(userId: string) {
    const result = await resetPassword(userId);
    if (result.success && result.tempPassword) {
      setTempPassword(result.tempPassword);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, must_change_password: true } : u
        )
      );
      toast.success('Password has been reset');
    } else {
      toast.error(result.error ?? 'Failed to reset password');
      setResetUser(null);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-stone-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50/80 hover:bg-stone-50/80">
              <TableHead className="text-stone-600">Username</TableHead>
              <TableHead className="text-stone-600">Display Name</TableHead>
              <TableHead className="text-stone-600">Role</TableHead>
              <TableHead className="text-stone-600">Status</TableHead>
              <TableHead className="text-stone-600">Last Login</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-stone-50/50">
                  <TableCell className="font-medium text-stone-800">{user.username}</TableCell>
                  <TableCell className="text-stone-600">{user.display_name}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell className="text-stone-400">
                    {user.last_login_at
                      ? formatRelative(user.last_login_at)
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setResetUser(user)}
                        >
                          <KeyRound className="size-4" />
                          Reset Password
                        </DropdownMenuItem>
                        {isLocked(user) && (
                          <DropdownMenuItem
                            onClick={() => handleUnlock(user)}
                          >
                            <Unlock className="size-4" />
                            Unlock Account
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant={user.is_active ? 'destructive' : 'default'}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="size-4" />
                              Disable User
                            </>
                          ) : (
                            <>
                              <UserCheck className="size-4" />
                              Enable User
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ResetPasswordDialog
        user={resetUser}
        tempPassword={tempPassword}
        onConfirm={handleResetConfirm}
        onClose={() => {
          setResetUser(null);
          setTempPassword(null);
        }}
      />
    </>
  );
}
