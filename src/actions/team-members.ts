'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/middleware';
import type { User } from '@/lib/db/types';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

async function requireTeamAccess(teamId: string) {
  const session = await requireAuth();
  if (session.user.role === 'admin') return session;

  // Team leads can manage their own team
  if (session.user.role === 'team_lead') {
    const { data } = await db
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', session.user.id)
      .eq('role', 'lead')
      .single();

    if (data) return session;
  }

  throw new Error('Forbidden');
}

export async function addMember(
  teamId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireTeamAccess(teamId);

    const userId = formData.get('user_id') as string;
    const role = (formData.get('role') as string) || 'member';

    if (!userId) {
      return { success: false, error: 'User is required' };
    }

    if (!['lead', 'member'].includes(role)) {
      return { success: false, error: 'Invalid role' };
    }

    const { error } = await db.from('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'User is already a team member' };
      }
      throw error;
    }

    revalidatePath(`/teams/${teamId}`);
    revalidatePath('/teams');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function removeMember(
  teamId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireTeamAccess(teamId);

    const { error } = await db
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath(`/teams/${teamId}`);
    revalidatePath('/teams');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateMemberRole(
  memberId: string,
  role: 'lead' | 'member'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();

    // Fetch the member to get the team_id
    const { data: member, error: fetchError } = await db
      .from('team_members')
      .select('team_id')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) {
      return { success: false, error: 'Member not found' };
    }

    await requireTeamAccess(member.team_id);

    if (!['lead', 'member'].includes(role)) {
      return { success: false, error: 'Invalid role' };
    }

    const { error } = await db
      .from('team_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;

    revalidatePath(`/teams/${member.team_id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getAvailableUsers(
  teamId: string
): Promise<{
  users: Pick<User, 'id' | 'username' | 'display_name'>[];
  error?: string;
}> {
  try {
    await requireTeamAccess(teamId);

    // Get current team member user IDs
    const { data: existingMembers } = await db
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const memberUserIds = (existingMembers ?? []).map(
      (m: { user_id: string }) => m.user_id
    );

    let query = db
      .from('users')
      .select('id, username, display_name')
      .eq('is_active', true)
      .order('display_name');

    if (memberUserIds.length > 0) {
      query = query.not('id', 'in', `(${memberUserIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { users: data as Pick<User, 'id' | 'username' | 'display_name'>[] };
  } catch (e) {
    return { users: [], error: (e as Error).message };
  }
}
