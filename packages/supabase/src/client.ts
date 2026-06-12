// Browser Supabase client factory. Generic over Database type so each app
// can pass its own (frontend/admin currently have divergent partial schemas;
// Phase 3 will merge them into @repo/db-types).
import { createBrowserClient } from "@supabase/ssr";

import { requireEnv } from "./env";

export function createClient<TDatabase = unknown>() {
  return createBrowserClient<TDatabase>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
