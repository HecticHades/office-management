'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import type { Zone, Team, Desk } from '@/lib/db/types';

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

export async function getZones(): Promise<{
  zones: (Zone & { teams: Pick<Team, 'id' | 'name' | 'color'>[]; deskCount: number })[];
  error?: string;
}> {
  try {
    await requireAuth();

    const { data: zones, error } = await db
      .from('zones')
      .select('*, zone_teams(team_id, teams:team_id(id, name, color))')
      .order('floor', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    const zoneIds = (zones || []).map((z: Zone) => z.id);

    let deskCounts: Record<string, number> = {};
    if (zoneIds.length > 0) {
      const { data: desks, error: deskError } = await db
        .from('desks')
        .select('zone_id')
        .in('zone_id', zoneIds);

      if (!deskError && desks) {
        deskCounts = desks.reduce((acc: Record<string, number>, d: { zone_id: string }) => {
          acc[d.zone_id] = (acc[d.zone_id] || 0) + 1;
          return acc;
        }, {});
      }
    }

    const result = (zones || []).map((z: Record<string, unknown>) => {
      const zoneTeamRows = (z.zone_teams as { teams: Pick<Team, 'id' | 'name' | 'color'> | null }[]) || [];
      const teams = zoneTeamRows
        .map((zt) => zt.teams)
        .filter((t): t is Pick<Team, 'id' | 'name' | 'color'> => t !== null);

      const { zone_teams: _zt, ...rest } = z as Record<string, unknown>;
      return {
        ...rest,
        teams,
        deskCount: deskCounts[z.id as string] || 0,
      };
    });

    return { zones: result as unknown as (Zone & { teams: Pick<Team, 'id' | 'name' | 'color'>[]; deskCount: number })[] };
  } catch (e) {
    return { zones: [], error: (e as Error).message };
  }
}

export async function getZone(zoneId: string): Promise<{
  zone?: Zone & { teams: Pick<Team, 'id' | 'name' | 'color'>[]; desks: Desk[] };
  error?: string;
}> {
  try {
    await requireAuth();

    const { data: zone, error } = await db
      .from('zones')
      .select('*, zone_teams(team_id, teams:team_id(id, name, color))')
      .eq('id', zoneId)
      .single();

    if (error) throw error;

    const { data: desks, error: desksError } = await db
      .from('desks')
      .select('*')
      .eq('zone_id', zoneId)
      .order('label', { ascending: true });

    if (desksError) throw desksError;

    const zoneTeamRows = (zone.zone_teams as { teams: Pick<Team, 'id' | 'name' | 'color'> | null }[]) || [];
    const teams = zoneTeamRows
      .map((zt) => zt.teams)
      .filter((t): t is Pick<Team, 'id' | 'name' | 'color'> => t !== null);

    return {
      zone: {
        ...zone,
        zone_teams: undefined,
        teams,
        desks: desks || [],
      } as Zone & { teams: Pick<Team, 'id' | 'name' | 'color'>[]; desks: Desk[] },
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function createZone(formData: FormData): Promise<{
  success: boolean;
  zone?: Zone;
  error?: string;
}> {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || null;
    const floor = parseInt(formData.get('floor') as string, 10);
    const teamIdsRaw = formData.get('team_ids') as string;
    const teamIds = teamIdsRaw ? teamIdsRaw.split(',').filter(Boolean) : [];
    const capacity = parseInt(formData.get('capacity') as string, 10);
    const color = (formData.get('color') as string) || '#3b82f6';

    if (!name || isNaN(floor) || isNaN(capacity)) {
      return { success: false, error: 'Name, floor, and capacity are required.' };
    }

    const { data: zone, error } = await db
      .from('zones')
      .insert({
        name,
        description,
        floor,
        team_id: teamIds[0] || null, // Keep legacy column in sync
        capacity,
        color,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert zone_teams rows
    if (teamIds.length > 0) {
      const { error: ztError } = await db
        .from('zone_teams')
        .insert(teamIds.map((tid) => ({ zone_id: zone.id, team_id: tid })));
      if (ztError) throw ztError;
    }

    revalidatePath('/spaces');
    return { success: true, zone };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateZone(zoneId: string, formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || null;
    const floor = parseInt(formData.get('floor') as string, 10);
    const teamIdsRaw = formData.get('team_ids') as string;
    const teamIds = teamIdsRaw ? teamIdsRaw.split(',').filter(Boolean) : [];
    const capacity = parseInt(formData.get('capacity') as string, 10);
    const color = (formData.get('color') as string) || '#3b82f6';

    if (!name || isNaN(floor) || isNaN(capacity)) {
      return { success: false, error: 'Name, floor, and capacity are required.' };
    }

    const { error } = await db
      .from('zones')
      .update({
        name,
        description,
        floor,
        team_id: teamIds[0] || null, // Keep legacy column in sync
        capacity,
        color,
      })
      .eq('id', zoneId);

    if (error) throw error;

    // Replace zone_teams: delete old, insert new
    await db.from('zone_teams').delete().eq('zone_id', zoneId);
    if (teamIds.length > 0) {
      const { error: ztError } = await db
        .from('zone_teams')
        .insert(teamIds.map((tid) => ({ zone_id: zoneId, team_id: tid })));
      if (ztError) throw ztError;
    }

    revalidatePath('/spaces');
    revalidatePath(`/spaces/${zoneId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteZone(zoneId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    const { error } = await db.from('zones').delete().eq('id', zoneId);

    if (error) throw error;

    revalidatePath('/spaces');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getTeamsForSelect(): Promise<{
  teams: Pick<Team, 'id' | 'name' | 'color'>[];
  error?: string;
}> {
  try {
    await requireAuth();

    const { data: teams, error } = await db
      .from('teams')
      .select('id, name, color')
      .order('name', { ascending: true });

    if (error) throw error;

    return { teams: teams || [] };
  } catch (e) {
    return { teams: [], error: (e as Error).message };
  }
}
