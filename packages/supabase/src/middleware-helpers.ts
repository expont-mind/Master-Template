// Middleware-level Supabase helpers that work with NextRequest/NextResponse.
// Each app composes these with its own routing logic.
import { createServerClient } from "@supabase/ssr";

import { requireEnv } from "./env";

import type { NextRequest, NextResponse } from "next/server";

// Supabase SSR chunks auth tokens across several cookies. When the chunk count
// exceeds 5 we approach the HTTP header byte limit (HTTP 431). Clear them all
// so the next request re-establishes the session cleanly.
export function clearStaleChunkedCookies(request: NextRequest, response: NextResponse) {
  const chunked = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((name) => /^sb-.*-auth-token\.\d+$/.test(name));

  if (chunked.length > 5) {
    for (const name of chunked) response.cookies.delete(name);
  }
}

// Build a Supabase server client that reads cookies from the incoming request
// and writes any rotated cookies onto the response. Generic over Database type.
export function createMiddlewareSupabaseClient<TDatabase = unknown>(
  request: NextRequest,
  setResponse: (next: NextResponse) => void,
  initialResponse: NextResponse,
) {
  let response = initialResponse;

  const client = createServerClient<TDatabase>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          setResponse(response);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { client, getResponse: () => response };
}
