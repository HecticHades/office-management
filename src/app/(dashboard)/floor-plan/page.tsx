import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { FloorPlanPlaceholder } from '@/components/floor-plan/FloorPlanPlaceholder';

export default async function FloorPlanPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Floor Plan</h1>
        <p className="text-muted-foreground">
          Interactive office layout and desk placement
        </p>
      </div>

      <FloorPlanPlaceholder />
    </div>
  );
}
