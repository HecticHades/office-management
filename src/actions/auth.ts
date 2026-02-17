'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db/client';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';
import {
  createSession,
  validateSession,
  revokeSession,
  revokeAllUserSessions,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
} from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { loginSchema, changePasswordSchema } from '@/lib/validators/auth';
import { AUTH, RATE_LIMITS } from '@/lib/constants';
import type { User } from '@/lib/db/types';

async function getClientIp(): Promise<string | undefined> {
  const hdrs = await headers();
  return (
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    undefined
  );
}

async function getUserAgent(): Promise<string | undefined> {
  const hdrs = await headers();
  return hdrs.get('user-agent') ?? undefined;
}

async function auditLog(
  userId: string | null,
  action: string,
  details?: Record<string, unknown>
) {
  const ip = await getClientIp();
  await db.from('auth_audit_log').insert({
    user_id: userId,
    action,
    details: details ?? null,
    ip_address: ip ?? null,
  });
}

export async function login(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; fieldErrors?: Record<string, string[]> }> {
  const raw = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { username, password } = parsed.data;
  const ip = await getClientIp();

  // Rate limit check
  const rateLimitKey = `login:${ip ?? 'unknown'}:${username}`;
  const rateLimit = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.LOGIN.maxAttempts,
    RATE_LIMITS.LOGIN.windowMinutes
  );
  if (!rateLimit.allowed) {
    return {
      error: `Too many login attempts. Try again after ${rateLimit.resetAt.toLocaleTimeString()}.`,
    };
  }

  // Find user
  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (!user) {
    await auditLog(null, 'login_failed', { username, reason: 'user_not_found' });
    return { error: 'Invalid username or password.' };
  }

  const typedUser = user as User;

  // Check if user is active
  if (!typedUser.is_active) {
    await auditLog(typedUser.id, 'login_failed', { reason: 'account_disabled' });
    return { error: 'Your account has been disabled. Contact an administrator.' };
  }

  // Check lockout
  if (
    typedUser.locked_until &&
    new Date(typedUser.locked_until) > new Date()
  ) {
    await auditLog(typedUser.id, 'login_failed', { reason: 'account_locked' });
    return {
      error: 'Account is temporarily locked due to too many failed attempts. Try again later.',
    };
  }

  // Check temp passwords first
  let isTempPassword = false;
  const { data: tempPasswords } = await db
    .from('temp_passwords')
    .select('*')
    .eq('user_id', typedUser.id)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (tempPasswords && tempPasswords.length > 0) {
    for (const tp of tempPasswords) {
      const tempValid = await verifyPassword(password, tp.password_hash);
      if (tempValid) {
        isTempPassword = true;
        // Mark temp password as used
        await db
          .from('temp_passwords')
          .update({ used_at: new Date().toISOString() })
          .eq('id', tp.id);
        break;
      }
    }
  }

  // If not a temp password, verify against main password
  if (!isTempPassword) {
    const validPassword = await verifyPassword(password, typedUser.password_hash);
    if (!validPassword) {
      const newAttempts = typedUser.failed_login_attempts + 1;
      const updates: Record<string, unknown> = {
        failed_login_attempts: newAttempts,
      };

      // Lock account if too many attempts
      if (newAttempts >= AUTH.MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(
          lockedUntil.getMinutes() + AUTH.LOCKOUT_DURATION_MINUTES
        );
        updates.locked_until = lockedUntil.toISOString();
      }

      await db.from('users').update(updates).eq('id', typedUser.id);
      await auditLog(typedUser.id, 'login_failed', {
        reason: 'invalid_password',
        attempts: newAttempts,
      });

      return { error: 'Invalid username or password.' };
    }
  }

  // Successful login - reset failed attempts
  await db
    .from('users')
    .update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      // If logged in with temp password, force password change
      must_change_password: isTempPassword || typedUser.must_change_password,
    })
    .eq('id', typedUser.id);

  // Create session
  const userAgentStr = await getUserAgent();
  const token = await createSession(typedUser.id, ip, userAgentStr);
  await setSessionCookie(token);

  await auditLog(typedUser.id, 'login_success', {
    temp_password: isTempPassword,
  });

  // Redirect based on state
  if (isTempPassword || typedUser.must_change_password) {
    redirect('/change-password');
  }

  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    const result = await validateSession(token);
    if (result) {
      await auditLog(result.user.id, 'logout');
    }
    await revokeSession(token);
  }
  await clearSessionCookie();
  redirect('/login');
}

export async function changePassword(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; fieldErrors?: Record<string, string[]>; success: boolean }> {
  const token = await getSessionCookie();
  if (!token) {
    redirect('/login');
  }

  const result = await validateSession(token);
  if (!result) {
    await clearSessionCookie();
    redirect('/login');
  }

  const { user } = result;
  const ip = await getClientIp();

  // Rate limit
  const rateLimitKey = `password_change:${user.id}`;
  const rateLimit = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.PASSWORD_CHANGE.maxAttempts,
    RATE_LIMITS.PASSWORD_CHANGE.windowMinutes
  );
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many password change attempts. Try again after ${rateLimit.resetAt.toLocaleTimeString()}.`,
    };
  }

  const raw = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { currentPassword, newPassword } = parsed.data;

  // Verify current password
  const currentValid = await verifyPassword(currentPassword, user.password_hash);
  if (!currentValid) {
    // Also check temp passwords
    let tempValid = false;
    const { data: tempPasswords } = await db
      .from('temp_passwords')
      .select('*')
      .eq('user_id', user.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());

    if (tempPasswords) {
      for (const tp of tempPasswords) {
        if (await verifyPassword(currentPassword, tp.password_hash)) {
          tempValid = true;
          await db
            .from('temp_passwords')
            .update({ used_at: new Date().toISOString() })
            .eq('id', tp.id);
          break;
        }
      }
    }

    if (!tempValid) {
      await auditLog(user.id, 'password_change_failed', {
        reason: 'invalid_current_password',
        ip,
      });
      return { success: false, error: 'Current password is incorrect.' };
    }
  }

  // Validate new password strength
  const strength = validatePasswordStrength(newPassword, user.username);
  if (!strength.valid) {
    return {
      success: false,
      error: 'New password is not strong enough.',
      fieldErrors: { newPassword: strength.feedback },
    };
  }

  // Hash and update
  const newHash = await hashPassword(newPassword);

  await db
    .from('users')
    .update({
      password_hash: newHash,
      must_change_password: false,
    })
    .eq('id', user.id);

  // Revoke all other sessions
  await revokeAllUserSessions(user.id);

  // Create a new session for the current user
  const userAgentStr = await getUserAgent();
  const newToken = await createSession(user.id, ip, userAgentStr);
  await setSessionCookie(newToken);

  await auditLog(user.id, 'password_changed', { ip });

  return { success: true };
}
