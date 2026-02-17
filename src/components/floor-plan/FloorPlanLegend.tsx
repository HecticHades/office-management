'use client';

import { cn } from '@/lib/utils';

const LEGEND_ITEMS = [
  { color: 'bg-emerald-500', label: 'Available' },
  { color: 'bg-sky-500', label: 'My Booking' },
  { color: 'bg-stone-400', label: 'Occupied' },
  { color: 'bg-amber-500', label: 'Reserved' },
  { color: 'bg-rose-500', label: 'Maintenance' },
] as const;

function FloorPlanLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={cn('h-3 w-3 rounded-full', item.color)} />
          <span className="text-xs text-stone-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export { FloorPlanLegend };
