'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import type { Desk, Zone, Booking } from '@/lib/db/types';

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

export async function getDesks(filters?: {
  zoneId?: string;
  status?: string;
  type?: string;
}): Promise<{
  desks: (Desk & {
    zone: Pick<Zone, 'id' | 'name'>;
    currentBooking?: Pick<Booking, 'id' | 'user_id' | 'time_slot'>;
  })[];
  error?: string;
}> {
  try {
    await requireAuth();

    let query = db.from('desks').select('*, zones:zone_id(id, name)');

    if (filters?.zoneId) {
      query = query.eq('zone_id', filters.zoneId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('desk_type', filters.type);
    }

    const { data: desks, error } = await query.order('label', { ascending: true });

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    const deskIds = (desks || []).map((d: Desk) => d.id);

    let bookingsByDesk: Record<string, Pick<Booking, 'id' | 'user_id' | 'time_slot'>> = {};
    if (deskIds.length > 0) {
      const { data: bookings } = await db
        .from('bookings')
        .select('id, desk_id, user_id, time_slot')
        .in('desk_id', deskIds)
        .eq('date', today)
        .eq('status', 'confirmed');

      if (bookings) {
        for (const b of bookings as { id: string; desk_id: string; user_id: string; time_slot: string }[]) {
          bookingsByDesk[b.desk_id] = { id: b.id, user_id: b.user_id, time_slot: b.time_slot as Booking['time_slot'] };
        }
      }
    }

    const result = (desks || []).map((d: Record<string, unknown>) => ({
      ...d,
      zone: d.zones || { id: '', name: '' },
      currentBooking: bookingsByDesk[d.id as string] || undefined,
    }));

    return {
      desks: result as (Desk & {
        zone: Pick<Zone, 'id' | 'name'>;
        currentBooking?: Pick<Booking, 'id' | 'user_id' | 'time_slot'>;
      })[],
    };
  } catch (e) {
    return { desks: [], error: (e as Error).message };
  }
}

export async function getDesk(deskId: string): Promise<{
  desk?: Desk & { zone: Zone; bookings: Booking[] };
  error?: string;
}> {
  try {
    await requireAuth();

    const { data: desk, error } = await db
      .from('desks')
      .select('*, zones:zone_id(*)')
      .eq('id', deskId)
      .single();

    if (error) throw error;

    const { data: bookings, error: bookingsError } = await db
      .from('bookings')
      .select('*')
      .eq('desk_id', deskId)
      .eq('status', 'confirmed')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (bookingsError) throw bookingsError;

    return {
      desk: {
        ...desk,
        zone: desk.zones,
        bookings: bookings || [],
      } as Desk & { zone: Zone; bookings: Booking[] },
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function createDesk(formData: FormData): Promise<{
  success: boolean;
  desk?: Desk;
  error?: string;
}> {
  try {
    await requireAdmin();

    const label = formData.get('label') as string;
    const zoneId = formData.get('zone_id') as string;
    const deskType = formData.get('desk_type') as Desk['desk_type'];
    const status = (formData.get('status') as Desk['status']) || 'available';
    const posX = parseFloat(formData.get('pos_x') as string) || 0;
    const posY = parseFloat(formData.get('pos_y') as string) || 0;
    const rotation = parseFloat(formData.get('rotation') as string) || 0;
    const equipmentStr = formData.get('equipment') as string;
    const equipment = equipmentStr
      ? equipmentStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (!label || !zoneId || !deskType) {
      return { success: false, error: 'Label, zone, and desk type are required.' };
    }

    const { data: desk, error } = await db
      .from('desks')
      .insert({
        label,
        zone_id: zoneId,
        desk_type: deskType,
        status,
        pos_x: posX,
        pos_y: posY,
        rotation,
        equipment,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/desks');
    revalidatePath(`/spaces/${zoneId}`);
    return { success: true, desk };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateDesk(deskId: string, formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    const label = formData.get('label') as string;
    const zoneId = formData.get('zone_id') as string;
    const deskType = formData.get('desk_type') as Desk['desk_type'];
    const status = formData.get('status') as Desk['status'];
    const posX = parseFloat(formData.get('pos_x') as string) || 0;
    const posY = parseFloat(formData.get('pos_y') as string) || 0;
    const rotation = parseFloat(formData.get('rotation') as string) || 0;
    const equipmentStr = formData.get('equipment') as string;
    const equipment = equipmentStr
      ? equipmentStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (!label || !zoneId || !deskType || !status) {
      return { success: false, error: 'Label, zone, desk type, and status are required.' };
    }

    const { error } = await db
      .from('desks')
      .update({
        label,
        zone_id: zoneId,
        desk_type: deskType,
        status,
        pos_x: posX,
        pos_y: posY,
        rotation,
        equipment,
      })
      .eq('id', deskId);

    if (error) throw error;

    revalidatePath('/desks');
    revalidatePath(`/spaces/${zoneId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteDesk(deskId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    const { data: desk } = await db
      .from('desks')
      .select('zone_id')
      .eq('id', deskId)
      .single();

    const { error } = await db.from('desks').delete().eq('id', deskId);

    if (error) throw error;

    revalidatePath('/desks');
    if (desk) revalidatePath(`/spaces/${desk.zone_id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
