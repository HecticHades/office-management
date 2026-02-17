import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { FloorPlanPlaceholder } from '@/components/floor-plan/FloorPlanPlaceholder';

export default async function FloorPlanPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">Floor Plan</h1>
        <p className="text-stone-500 mt-1">
          Interactive office layout and desk placement
        </p>
      </div>

      <FloorPlanPlaceholder />
    </div>
  );
}
