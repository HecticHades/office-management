'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  Building2,
  Calendar,
  LayoutDashboard,
  Map,
  Monitor,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/spaces', label: 'Spaces', icon: Map },
  { href: '/desks', label: 'Desks', icon: Monitor },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/floor-plan', label: 'Floor Plan', icon: Building2 },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { isAdmin } = usePermissions();

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col bg-slate-900 text-white',
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-slate-700 px-4">
        <Building2 className="h-6 w-6 text-blue-400" />
        <span className="text-lg font-semibold">Office Mgmt</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3 bg-slate-700" />

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </nav>
    </aside>
  );
}
