'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/middleware';
import type { Team, TeamMember, User } from '@/lib/db/types';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'admin') throw new Error('Forbidden');
  return session;
}

export async function getTeams(): Promise<{
  teams: (Team & { memberCount: number })[];
  error?: string;
}> {
  try {
    await requireAuth();

    const { data, error } = await db
      .from('teams')
      .select('*, team_members(count)')
      .order('name');

    if (error) throw error;

    const teams = (data ?? []).map((team: Record<string, unknown>) => {
      const { team_members, ...rest } = team;
      return {
        ...rest,
        memberCount:
          (team_members as { count: number }[])?.[0]?.count ?? 0,
      };
    }) as unknown as (Team & { memberCount: number })[];

    return { teams };
  } catch (e) {
    return { teams: [], error: (e as Error).message };
  }
}

export async function getTeam(teamId: string): Promise<{
  team: (Team & {
    members: (TeamMember & {
      user: Pick<User, 'id' | 'username' | 'display_name' | 'role'>;
    })[];
  }) | null;
  error?: string;
}> {
  try {
    await requireAuth();

    const { data: team, error: teamError } = await db
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    const { data: members, error: membersError } = await db
      .from('team_members')
      .select('*, users:user_id(id, username, display_name, role)')
      .eq('team_id', teamId)
      .order('role')
      .order('joined_at');

    if (membersError) throw membersError;

    const formattedMembers = (members ?? []).map(
      (m: Record<string, unknown>) => {
        const { users, ...rest } = m;
        return {
          ...rest,
          user: users as Pick<User, 'id' | 'username' | 'display_name' | 'role'>,
        };
      }
    ) as unknown as (TeamMember & {
      user: Pick<User, 'id' | 'username' | 'display_name' | 'role'>;
    })[];

    return {
      team: { ...team, members: formattedMembers } as Team & {
        members: (TeamMember & {
          user: Pick<User, 'id' | 'username' | 'display_name' | 'role'>;
        })[];
      },
    };
  } catch (e) {
    return { team: null, error: (e as Error).message };
  }
}

export async function createTeam(
  formData: FormData
): Promise<{ success: boolean; team?: Team; error?: string }> {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;

    if (!name) {
      return { success: false, error: 'Team name is required' };
    }

    const { data, error } = await db
      .from('teams')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Team name already exists' };
      }
      throw error;
    }

    revalidatePath('/teams');
    return { success: true, team: data as Team };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateTeam(
  teamId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;

    if (!name) {
      return { success: false, error: 'Team name is required' };
    }

    const { error } = await db
      .from('teams')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Team name already exists' };
      }
      throw error;
    }

    revalidatePath('/teams');
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteTeam(
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const { error } = await db.from('teams').delete().eq('id', teamId);
    if (error) throw error;

    revalidatePath('/teams');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
