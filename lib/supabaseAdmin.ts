// lib/supabaseAdmin.ts
// Server-only Supabase client using the SERVICE ROLE key.
// Never import this from client-side code.

import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,   // same URL as anon client
  process.env.SUPABASE_SERVICE_ROLE!,      // server-only key from Vercel env
  { auth: { persistSession: false } }
);
