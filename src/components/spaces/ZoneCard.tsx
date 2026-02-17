'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Monitor, Users } from 'lucide-react';
import type { Zone, Team } from '@/lib/db/types';

type ZoneCardProps = {
  zone: Zone & { team?: Pick<Team, 'id' | 'name' | 'color'>; deskCount: number };
};

export function ZoneCard({ zone }: ZoneCardProps) {
  return (
    <Link href={`/spaces/${zone.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: zone.color }}
              />
              <CardTitle className="text-lg">{zone.name}</CardTitle>
            </div>
            <Badge variant="outline">Floor {zone.floor}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {zone.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {zone.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Monitor className="h-4 w-4" />
              <span>{zone.deskCount} desks</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Cap: {zone.capacity}</span>
            </div>
          </div>
          {zone.team && (
            <div className="flex items-center gap-1.5">
              <Map className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${zone.team.color}20`,
                  color: zone.team.color,
                  borderColor: `${zone.team.color}40`,
                }}
              >
                {zone.team.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
