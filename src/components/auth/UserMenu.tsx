'use client';

import { useSession } from '@/lib/hooks/use-session';
import { logout } from '@/actions/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  team_lead: 'Team Lead',
  member: 'Member',
};

export function UserMenu() {
  const { user } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="size-8">
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-medium text-white">
              {getInitials(user.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden items-start gap-1 md:flex md:flex-col">
            <span className="text-sm font-medium text-foreground">{user.display_name}</span>
            <span className="text-xs text-muted-foreground">{roleLabels[user.role] || user.role}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{user.display_name}</span>
            <Badge className="w-fit bg-teal-600/10 text-xs text-teal-700 hover:bg-teal-600/10">
              {roleLabels[user.role] || user.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logout()}
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
