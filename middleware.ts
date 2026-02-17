import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const PUBLIC_PATHS = ['/login', '/change-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals, and auth API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session_token')?.value;

  // No session token
  if (!token) {
    if (PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session by checking the DB
  const tokenHash = await sha256(token);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // If env vars are missing, allow through to avoid crash loops
    return NextResponse.next();
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: session } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    // Invalid or expired session
    if (PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session_token');
    return response;
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, role, is_active, must_change_password')
    .eq('id', session.user_id)
    .single();

  if (!user || !user.is_active) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session_token');
    return response;
  }

  // Must change password redirect
  if (user.must_change_password && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  // If already on change-password but don't need to, redirect to dashboard
  if (!user.must_change_password && pathname === '/change-password') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If authenticated user tries to visit login, redirect to dashboard
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info headers for downstream usage
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-role', user.role);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
