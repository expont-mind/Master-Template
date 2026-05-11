/**
 * Returns the auth callback URL using the current browser origin.
 * This ensures OAuth redirects return to whichever domain the user is on
 * (monpang.mn or monpang.com).
 */
export function getAuthCallbackUrl(next: string = "/"): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.monpang.mn");
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
