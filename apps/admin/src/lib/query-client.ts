import { QueryClient, isServer } from "@tanstack/react-query";

/**
 * Centralised staleTime tiers. Individual `useQuery` hooks should pick
 * a tier and override as needed instead of sprinkling magic numbers —
 * this makes cache behaviour auditable at one glance.
 */
export const STALE_TIMES = {
  /** Default for mutable resources (orders, users, inventory). */
  default: 60 * 1000, // 1 min
  /** Rarely changes during a session — categories, brands, warehouses. */
  reference: 5 * 60 * 1000, // 5 min
  /** Analytics-style aggregates computed over long windows. */
  analytics: 5 * 60 * 1000, // 5 min
  /** For things that almost never change (policy text, enum labels). */
  static: 30 * 60 * 1000, // 30 min
} as const;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.default,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
