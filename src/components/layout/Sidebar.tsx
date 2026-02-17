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
        'flex h-full w-64 flex-col bg-[oklch(0.18_0.02_260)]',
        className
      )}
    >
      {/* Branding */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-teal-600">
          <Building2 className="size-[18px] text-white" />
        </div>
        <span className="font-[family-name:var(--font-display)] text-lg italic text-white">
          OfficeSpace
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        {/* Workspace section */}
        <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-widest text-stone-500">
          Workspace
        </div>
        <div className="space-y-0.5">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'border-l-[3px] border-teal-400 bg-teal-600/20 text-teal-400'
                    : 'border-l-[3px] border-transparent text-stone-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* System section */}
        <div className="mb-2 mt-8 px-3 text-[11px] font-medium uppercase tracking-widest text-stone-500">
          System
        </div>
        <div className="space-y-0.5">
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                pathname.startsWith('/admin')
                  ? 'border-l-[3px] border-teal-400 bg-teal-600/20 text-teal-400'
                  : 'border-l-[3px] border-transparent text-stone-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Shield className="size-[18px] shrink-0" />
              Admin
            </Link>
          )}

          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              pathname.startsWith('/settings')
                ? 'border-l-[3px] border-teal-400 bg-teal-600/20 text-teal-400'
                : 'border-l-[3px] border-transparent text-stone-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Settings className="size-[18px] shrink-0" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 px-5 py-4">
        <span className="text-xs text-stone-600">v1.0</span>
      </div>
    </aside>
  );
}
