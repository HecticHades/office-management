'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/middleware';
import { hashPassword, generateTempPassword } from '@/lib/auth/password';
import { revokeAllUserSessions } from '@/lib/auth/session';
import type { User, AuthAuditLog } from '@/lib/db/types';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (session.user.role !== 'admin') throw new Error('Forbidden');
  return session;
}

export async function getUsers(): Promise<{ users: User[]; error?: string }> {
  try {
    await requireAdmin();
    const { data, error } = await db
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { users: data as User[] };
  } catch (e) {
    return { users: [], error: (e as Error).message };
  }
}

export async function createUser(
  formData: FormData
): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
  try {
    const session = await requireAdmin();
    const username = formData.get('username') as string;
    const displayName = formData.get('display_name') as string;
    const role = formData.get('role') as User['role'];

    if (!username || !displayName || !role) {
      return { success: false, error: 'All fields are required' };
    }

    if (!['admin', 'team_lead', 'member'].includes(role)) {
      return { success: false, error: 'Invalid role' };
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const { data: user, error } = await db
      .from('users')
      .insert({
        username: username.toLowerCase().trim(),
        display_name: displayName.trim(),
        role,
        password_hash: passwordHash,
        is_active: true,
        must_change_password: true,
        failed_login_attempts: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Username already exists' };
      }
      throw error;
    }

    await db.from('temp_passwords').insert({
      user_id: user.id,
      password: tempPassword,
    });

    await db.from('auth_audit_log').insert({
      user_id: session.user.id,
      action: 'create_user',
      details: { target_user_id: user.id, username: user.username },
    });

    revalidatePath('/admin');
    return { success: true, tempPassword };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function resetPassword(
  userId: string
): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
  try {
    const session = await requireAdmin();

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const { error } = await db
      .from('users')
      .update({
        password_hash: passwordHash,
        must_change_password: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    await revokeAllUserSessions(userId);

    await db.from('temp_passwords').upsert({
      user_id: userId,
      password: tempPassword,
    });

    await db.from('auth_audit_log').insert({
      user_id: session.user.id,
      action: 'reset_password',
      details: { target_user_id: userId },
    });

    revalidatePath('/admin');
    return { success: true, tempPassword };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function unlockAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin();

    const { error } = await db
      .from('users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    await db.from('auth_audit_log').insert({
      user_id: session.user.id,
      action: 'unlock_account',
      details: { target_user_id: userId },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin();

    const { error } = await db
      .from('users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    if (!isActive) {
      await revokeAllUserSessions(userId);
    }

    await db.from('auth_audit_log').insert({
      user_id: session.user.id,
      action: isActive ? 'enable_user' : 'disable_user',
      details: { target_user_id: userId },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getAuditLog(
  page: number = 1,
  limit: number = 50
): Promise<{
  logs: (AuthAuditLog & { username?: string })[];
  total: number;
  error?: string;
}> {
  try {
    await requireAdmin();

    const offset = (page - 1) * limit;

    const { count } = await db
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true });

    const { data, error } = await db
      .from('auth_audit_log')
      .select('*, users:user_id(username)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const logs = (data ?? []).map((log: Record<string, unknown>) => {
      const { users, ...rest } = log;
      return {
        ...rest,
        username: (users as { username: string } | null)?.username,
      };
    }) as unknown as (AuthAuditLog & { username?: string })[];

    return { logs, total: count ?? 0 };
  } catch (e) {
    return { logs: [], total: 0, error: (e as Error).message };
  }
}
