import type { AdminApiOptions } from "./admin-api";

export function appendFilters(
  params: URLSearchParams,
  filters: Record<string, string> | undefined,
): void {
  if (!filters) return;
  Object.entries(filters).forEach(([key, value]) => {
    params.set(key, value);
  });
}

function setIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined | null,
): void {
  if (value === undefined || value === null) return;
  params.set(key, typeof value === "string" ? value : value.toString());
}

/**
 * Builds the URLSearchParams for the data-fetch leg of a paginated request:
 * shared filters + select/order/limit/offset.
 */
export function buildPaginatedDataParams(options: AdminApiOptions | undefined): URLSearchParams {
  const params = new URLSearchParams();
  appendFilters(params, options?.filters);
  setIfPresent(params, "select", options?.select);
  setIfPresent(params, "order", options?.order);
  setIfPresent(params, "limit", options?.limit);
  setIfPresent(params, "offset", options?.offset);
  return params;
}

/**
 * Builds the URLSearchParams for the count-only leg: shared filters with a
 * lightweight select and a forced count=exact + limit=0 to avoid pulling
 * data on the count query.
 */
export function buildPaginatedCountParams(options: AdminApiOptions | undefined): URLSearchParams {
  const params = new URLSearchParams();
  appendFilters(params, options?.filters);
  params.set("select", "id");
  params.set("count", "exact");
  params.set("limit", "0");
  params.set("offset", "0");
  return params;
}

export function parseTotalCountHeader(headers: Headers): number | null {
  const value = headers.get("X-Total-Count");
  return value ? parseInt(value, 10) : null;
}
