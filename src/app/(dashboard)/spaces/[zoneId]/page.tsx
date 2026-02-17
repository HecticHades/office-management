import { getSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import { getZone } from '@/actions/zones';
import { DeskGrid } from '@/components/spaces/DeskGrid';
import { ZoneForm } from '@/components/spaces/ZoneForm';
import { DeskForm } from '@/components/desks/DeskForm';
import { ZoneDeleteButton } from '@/components/spaces/ZoneDeleteButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Monitor, Plus, Users } from 'lucide-react';
import Link from 'next/link';

export default async function ZoneDetailPage({
  params,
}: {
  params: Promise<{ zoneId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { zoneId } = await params;
  const { zone, error } = await getZone(zoneId);

  if (error || !zone) notFound();

  const isAdmin = session.user.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/spaces">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: zone.color }}
            />
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">{zone.name}</h1>
            <Badge variant="outline" className="rounded-full border-stone-200 text-stone-600">Floor {zone.floor}</Badge>
          </div>
          {zone.description && (
            <p className="text-stone-500 mt-1">{zone.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <ZoneForm
              zone={zone}
              trigger={
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              }
            />
            <ZoneDeleteButton zoneId={zone.id} zoneName={zone.name} />
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-50">
              <Monitor className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{zone.desks.length}</p>
              <p className="text-sm text-stone-500">Total Desks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{zone.capacity}</p>
              <p className="text-sm text-stone-500">Capacity</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: zone.team?.color || '#94a3b8' }}
            />
            <div>
              <p className="text-sm font-medium text-stone-800">{zone.team?.name || 'Open Zone'}</p>
              <p className="text-sm text-stone-500">Team Assignment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-stone-800">Desks</CardTitle>
          {isAdmin && (
            <DeskForm
              zoneId={zone.id}
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Desk
                </Button>
              }
            />
          )}
        </CardHeader>
        <CardContent>
          <DeskGrid desks={zone.desks} />
        </CardContent>
      </Card>
    </div>
  );
}
