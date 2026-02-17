import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { FloorPlanView } from '@/components/floor-plan/FloorPlanView';

export default async function FloorPlanPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-stone-800">
          Floor Plan
        </h1>
        <p className="text-stone-500 mt-1">
          Interactive office layout with live desk availability
        </p>
      </div>
      <FloorPlanView />
    </div>
  );
}
