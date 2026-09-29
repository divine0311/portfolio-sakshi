import {createClient} from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = /^https?:\/\//.test(url) && anonKey.length > 0;

/**
 * A single client is shared by the public site and the /admin studio.
 *
 * Sessions are persisted so that signing in through Supabase Auth upgrades this
 * client's JWT to the `authenticated` role, which is what the RLS write
 * policies on the CMS tables require. Visitors never sign in, so on the public
 * site the same client simply stays on the `anon` role.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true},
    })
  : null;
