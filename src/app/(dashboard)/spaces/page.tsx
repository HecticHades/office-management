import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getZones } from '@/actions/zones';
import { ZoneCard } from '@/components/spaces/ZoneCard';
import { ZoneForm } from '@/components/spaces/ZoneForm';
import { Button } from '@/components/ui/button';
import { Plus, Map } from 'lucide-react';

export default async function SpacesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { zones, error } = await getZones();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground">
            Manage office zones and areas
          </p>
        </div>
        {session.user.role === 'admin' && (
          <ZoneForm
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Zone
              </Button>
            }
          />
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {zones.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
          <Map className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">No zones yet</p>
          <p className="text-sm">Create your first office zone to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      )}
    </div>
  );
}
