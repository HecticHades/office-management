import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDesks } from '@/actions/desks';
import { getZones } from '@/actions/zones';
import { DeskTable } from '@/components/desks/DeskTable';
import { DeskForm } from '@/components/desks/DeskForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function DesksPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [{ desks, error }, { zones }] = await Promise.all([
    getDesks(),
    getZones(),
  ]);

  const zoneOptions = zones.map((z) => ({ id: z.id, name: z.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">Desks</h1>
          <p className="text-stone-500 mt-1">
            View and manage all office desks
          </p>
        </div>
        {session.user.role === 'admin' && (
          <DeskForm
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Desk
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

      <DeskTable desks={desks} zones={zoneOptions} />
    </div>
  );
}
