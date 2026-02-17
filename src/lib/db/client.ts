import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client with service role key (bypasses RLS)
// ONLY import this in Server Components, Server Actions, and API routes
const supabaseUrl = process.env.SUPABASE_URL || 'http://placeholder.invalid';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

let _db: SupabaseClient | null = null;

export const db = (() => {
  if (!_db) {
    _db = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _db;
})();
