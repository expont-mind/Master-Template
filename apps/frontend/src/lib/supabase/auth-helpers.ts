import { BRAND } from "@/lib/utils/brand-config";

/**
 * Returns the auth callback URL using the current browser origin.
 * Falls back to BRAND.url server-side so OAuth redirects always land
 * on the configured site, whichever domain alias the user is on.
 */
export function getAuthCallbackUrl(next: string = "/"): string {
  const origin = typeof window !== "undefined" ? window.location.origin : BRAND.url;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
