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
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">Spaces</h1>
          <p className="text-stone-500 mt-1">
            Manage office zones and areas
          </p>
        </div>
        {session.user.role === 'admin' && (
          <ZoneForm
            trigger={
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Zone
              </Button>
            }
          />
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {zones.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 py-16">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-stone-100">
            <Map className="h-8 w-8 text-stone-400" />
          </div>
          <p className="text-lg font-semibold text-stone-700">No zones yet</p>
          <p className="text-sm text-stone-500 mt-1">Create your first office zone to get started.</p>
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
