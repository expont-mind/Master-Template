// Server Supabase client factory for Server Components and Route Handlers.
// Each app passes its own cookies() store and Database type.

import { createServerClient } from "@supabase/ssr";

import { requireEnv } from "./env";

// Minimal shape we need from next/headers' cookies(). Avoids depending on Next.
export type CookieStore = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
};

export function createServerClientFromCookies<TDatabase = unknown>(cookieStore: CookieStore) {
  return createServerClient<TDatabase>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — safe to ignore as
            // long as middleware refreshes user sessions.
          }
        },
      },
    },
  );
}
