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
      <Card className="group relative overflow-hidden rounded-xl border-stone-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
          style={{ backgroundColor: team.color }}
        />
        <CardHeader className="pl-6">
          <CardTitle className="text-lg font-semibold text-stone-800 group-hover:text-teal-600 transition-colors">
            {team.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-6">
          {team.description && (
            <p className="text-sm text-stone-500 line-clamp-2 mb-3">
              {team.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-sm text-stone-400">
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
