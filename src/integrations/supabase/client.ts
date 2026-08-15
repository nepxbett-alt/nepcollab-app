import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// Known project fallbacks (publishable key is safe for client; env vars still preferred)
const FALLBACK_URL = 'https://ntnbhnazqncszasmwjyw.supabase.co';
const FALLBACK_KEY = 'sb_publishable_uV9hlMwM-4s9eS4CQAJhkA_J1fZG3Cs';

function createSupabaseClient(): SupabaseClient<Database> {
  const SUPABASE_URL =
    import.meta.env['VITE_SUPABASE_URL'] ||
    process.env['SUPABASE_URL'] ||
    FALLBACK_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
    process.env['SUPABASE_PUBLISHABLE_KEY'] ||
    FALLBACK_KEY;

  if (!import.meta.env['VITE_SUPABASE_URL'] && !process.env['SUPABASE_URL']) {
    console.warn('[Supabase] Using built-in project URL fallback. Set VITE_SUPABASE_URL in production.');
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}

let _supabase: SupabaseClient<Database> | undefined;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
