'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Monitor, Wrench } from 'lucide-react';
import type { Desk } from '@/lib/db/types';

type DeskGridProps = {
  desks: Desk[];
  onDeskClick?: (desk: Desk) => void;
};

const statusConfig = {
  available: { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: Monitor, label: 'Available' },
  maintenance: { color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Wrench, label: 'Maintenance' },
  reserved: { color: 'bg-stone-50 border-stone-200 text-stone-600', icon: Monitor, label: 'Reserved' },
} as const;

const typeLabels: Record<Desk['desk_type'], string> = {
  standard: 'Standard',
  standing: 'Standing',
  private: 'Private',
  shared: 'Shared',
};

export function DeskGrid({ desks, onDeskClick }: DeskGridProps) {
  if (desks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-stone-100">
          <Monitor className="h-6 w-6 text-stone-400" />
        </div>
        <p className="text-sm text-stone-500">No desks in this zone yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {desks.map((desk) => {
        const config = statusConfig[desk.status];
        const Icon = config.icon;

        return (
          <Card
            key={desk.id}
            className={cn(
              'cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
              config.color
            )}
            onClick={() => onDeskClick?.(desk)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{desk.label}</span>
                <Icon className="h-4 w-4 opacity-60" />
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs rounded-full border-current/20">
                  {typeLabels[desk.desk_type]}
                </Badge>
              </div>
              {desk.equipment && desk.equipment.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  {desk.equipment.join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
