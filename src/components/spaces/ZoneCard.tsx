'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Users } from 'lucide-react';
import type { Zone, Team } from '@/lib/db/types';

type ZoneCardProps = {
  zone: Zone & { teams: Pick<Team, 'id' | 'name' | 'color'>[]; deskCount: number };
};

export function ZoneCard({ zone }: ZoneCardProps) {
  return (
    <Link href={`/spaces/${zone.id}`}>
      <Card className="rounded-xl border-stone-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full overflow-hidden">
        <div
          className="h-1 w-full"
          style={{ backgroundColor: zone.color }}
        />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">{zone.name}</CardTitle>
            <Badge variant="outline" className="rounded-full border-stone-200 text-stone-500 text-xs">Floor {zone.floor}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {zone.description && (
            <p className="text-sm text-stone-500 line-clamp-2">
              {zone.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-stone-400">
            <div className="flex items-center gap-1">
              <Monitor className="h-4 w-4" />
              <span>{zone.deskCount} desks</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Cap: {zone.capacity}</span>
            </div>
          </div>
          {zone.teams.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {zone.teams.map((team) => (
                <Badge
                  key={team.id}
                  variant="secondary"
                  className="text-xs rounded-full"
                  style={{
                    backgroundColor: `${team.color}15`,
                    color: team.color,
                    borderColor: `${team.color}30`,
                  }}
                >
                  {team.name}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs rounded-full text-stone-400">
              Open Zone
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
