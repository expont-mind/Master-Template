// SERVICE ROLE Supabase client. Bypasses RLS — server-only.
//
// WARNING: Never import this from a "use client" file. The service-role key
// must not be bundled into client-side JavaScript.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "./env";

export function createAdminClient<TDatabase = unknown>() {
  return createSupabaseClient<TDatabase>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
