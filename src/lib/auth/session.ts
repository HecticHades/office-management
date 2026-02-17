import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { AUTH } from '@/lib/constants';
import type { User, Session } from '@/lib/db/types';

const COOKIE_NAME = 'session_token';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + AUTH.SESSION_DURATION_DAYS);

  const { error } = await db.from('sessions').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    ip_address: ip ?? null,
    user_agent: userAgent ?? null,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return token;
}

export async function validateSession(
  token: string
): Promise<{ user: User; session: Session } | null> {
  const tokenHash = hashToken(token);

  const { data: session, error: sessionError } = await db
    .from('sessions')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();

  if (sessionError || !session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await db.from('sessions').delete().eq('id', session.id);
    return null;
  }

  const { data: user, error: userError } = await db
    .from('users')
    .select('*')
    .eq('id', session.user_id)
    .single();

  if (userError || !user) return null;

  if (!user.is_active) return null;

  return { user: user as User, session: session as Session };
}

export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.from('sessions').delete().eq('token_hash', tokenHash);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.from('sessions').delete().eq('user_id', userId);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH.SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ user: User } | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const result = await validateSession(token);
  if (!result) return null;

  return { user: result.user };
}
