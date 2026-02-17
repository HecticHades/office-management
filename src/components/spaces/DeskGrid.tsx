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
  available: { color: 'bg-green-100 border-green-300 text-green-800', icon: Monitor, label: 'Available' },
  maintenance: { color: 'bg-amber-100 border-amber-300 text-amber-800', icon: Wrench, label: 'Maintenance' },
  reserved: { color: 'bg-slate-100 border-slate-300 text-slate-800', icon: Monitor, label: 'Reserved' },
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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Monitor className="h-10 w-10 mb-3" />
        <p className="text-sm">No desks in this zone yet.</p>
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
              'cursor-pointer transition-shadow hover:shadow-md border-2',
              config.color
            )}
            onClick={() => onDeskClick?.(desk)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{desk.label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
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
