'use client';

import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client with anon key (read-only via RLS)
// Only used for Realtime subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.invalid';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const realtimeClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});
