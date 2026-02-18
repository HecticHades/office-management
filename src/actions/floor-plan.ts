'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import type { Desk, Zone, TimeSlot, BookingStatus } from '@/lib/db/types';

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

export async function getFloorPlanData(date: string): Promise<{
  zones: (Pick<Zone, 'id' | 'name' | 'color' | 'boundary_path'> & {
    team_ids: string[];
    team_names: string[];
  })[];
  desks: (Desk & {
    zone_name: string;
    zone_color: string;
  })[];
  bookings: {
    id: string;
    desk_id: string;
    user_id: string;
    user_name: string;
    date: string;
    time_slot: TimeSlot;
    status: BookingStatus;
  }[];
  currentUserId: string;
  isAdmin: boolean;
  userTeamIds: string[];
  error?: string;
}> {
  try {
    const session = await requireAuth();

    const [zonesResult, desksResult, bookingsResult, membershipResult] = await Promise.all([
      db
        .from('zones')
        .select('id, name, color, boundary_path, zone_teams(team_id, teams:team_id(name))'),
      db.from('desks').select('*, zones:zone_id(name, color)'),
      db
        .from('bookings')
        .select(
          'id, desk_id, user_id, date, time_slot, status, users:user_id(display_name)'
        )
        .eq('date', date)
        .eq('status', 'confirmed'),
      db
        .from('team_members')
        .select('team_id')
        .eq('user_id', session.user.id),
    ]);

    if (zonesResult.error) throw zonesResult.error;
    if (desksResult.error) throw desksResult.error;
    if (bookingsResult.error) throw bookingsResult.error;

    const userTeamIds = (membershipResult.data || []).map(
      (m: Record<string, unknown>) => m.team_id as string
    );

    const zones = (zonesResult.data || []).map((z: Record<string, unknown>) => {
      const zoneTeamRows = (z.zone_teams as { team_id: string; teams: { name: string } | null }[]) || [];
      return {
        id: z.id as string,
        name: z.name as string,
        color: z.color as string,
        boundary_path: z.boundary_path as string | null,
        team_ids: zoneTeamRows.map((zt) => zt.team_id),
        team_names: zoneTeamRows
          .map((zt) => zt.teams?.name)
          .filter((n): n is string => !!n),
      };
    });

    const desks = (desksResult.data || []).map((d: Record<string, unknown>) => {
      const zoneData = d.zones as Record<string, unknown> | null;
      return {
        ...d,
        zone_name: (zoneData?.name as string) || '',
        zone_color: (zoneData?.color as string) || '',
      };
    }) as (Desk & { zone_name: string; zone_color: string })[];

    const bookings = (bookingsResult.data || []).map(
      (b: Record<string, unknown>) => {
        const userData = b.users as Record<string, unknown> | null;
        return {
          id: b.id as string,
          desk_id: b.desk_id as string,
          user_id: b.user_id as string,
          user_name: (userData?.display_name as string) || '',
          date: b.date as string,
          time_slot: b.time_slot as TimeSlot,
          status: b.status as BookingStatus,
        };
      }
    );

    return {
      zones,
      desks,
      bookings,
      currentUserId: session.user.id,
      isAdmin: session.user.role === 'admin',
      userTeamIds,
    };
  } catch (e) {
    return {
      zones: [],
      desks: [],
      bookings: [],
      currentUserId: '',
      isAdmin: false,
      userTeamIds: [],
      error: (e as Error).message,
    };
  }
}

export async function updateDeskPosition(
  deskId: string,
  pos_x: number,
  pos_y: number,
  rotation?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const updateData: Record<string, number> = { pos_x, pos_y };
    if (rotation !== undefined) {
      updateData.rotation = rotation;
    }

    const { error } = await db
      .from('desks')
      .update(updateData)
      .eq('id', deskId);

    if (error) throw error;

    revalidatePath('/floor-plan');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
