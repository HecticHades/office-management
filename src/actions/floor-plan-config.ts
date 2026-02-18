'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'admin') throw new Error('Forbidden');
  return session;
}

const FLOOR_PLAN_DEFAULTS = {
  image_url: null as string | null,
  canvas_width: 1200,
  canvas_height: 800,
};

export async function getFloorPlanConfig(): Promise<{
  image_url: string | null;
  canvas_width: number;
  canvas_height: number;
  error?: string;
}> {
  try {
    await requireAuth();

    const { data, error } = await db
      .from('app_settings')
      .select('value')
      .eq('key', 'floor_plan')
      .single();

    if (error || !data) {
      return { ...FLOOR_PLAN_DEFAULTS };
    }

    const value = data.value as Record<string, unknown>;
    return {
      image_url: (value.image_url as string | null) ?? null,
      canvas_width: (value.canvas_width as number) ?? 1200,
      canvas_height: (value.canvas_height as number) ?? 800,
    };
  } catch (e) {
    return {
      ...FLOOR_PLAN_DEFAULTS,
      error: (e as Error).message,
    };
  }
}

export async function updateFloorPlanConfig(config: {
  image_url?: string | null;
  canvas_width?: number;
  canvas_height?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // Fetch current value
    const { data: existing } = await db
      .from('app_settings')
      .select('value')
      .eq('key', 'floor_plan')
      .single();

    const currentValue = (existing?.value as Record<string, unknown>) ?? {
      ...FLOOR_PLAN_DEFAULTS,
    };

    const mergedValue = { ...currentValue, ...config };

    const { error } = await db
      .from('app_settings')
      .upsert(
        {
          key: 'floor_plan',
          value: mergedValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) throw error;

    revalidatePath('/floor-plan');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateZoneBoundary(
  zoneId: string,
  boundaryPath: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const { error } = await db
      .from('zones')
      .update({ boundary_path: boundaryPath })
      .eq('id', zoneId);

    if (error) throw error;

    revalidatePath('/floor-plan');
    revalidatePath('/spaces');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
