'use client';

import Link from 'next/link';
import type { Team } from '@/lib/db/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

type TeamCardProps = {
  team: Team & { memberCount: number };
};

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`}>
      <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: team.color }}
        />
        <CardHeader className="pl-5">
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {team.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-5">
          {team.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {team.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>
              {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
