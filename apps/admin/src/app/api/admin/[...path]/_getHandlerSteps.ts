import { NextResponse } from "next/server";

import {
  applyCategoryFilter,
  applyMultiWordSearch,
  applyOperatorFilters,
  applyOrdering,
  applyPagination,
  applySearchByTable,
} from "./_queryBuilders";

import type { createAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;
type Query = ReturnType<ReturnType<AdminClient["from"]>["select"]>;

export function buildInitialQuery(
  supabase: AdminClient,
  table: string,
  selectParam: string,
  wantCount: boolean,
): Query {
  return wantCount
    ? supabase.from(table).select(selectParam, { count: "exact" })
    : supabase.from(table).select(selectParam);
}

export async function fetchById(query: Query, id: string): Promise<NextResponse> {
  const { data, error } = await query.eq("id", id).single();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "PGRST116" ? 404 : 500 },
    );
  }
  return NextResponse.json(data);
}

/**
 * Build a list-query response: applies all the ordering / search / filter
 * chain in the canonical order. Returns either a short-circuit empty result
 * (when the category filter matches no rows) or the assembled query for the
 * caller to execute.
 */
export async function applyListBuilders(
  query: Query,
  table: string,
  searchParams: URLSearchParams,
  supabase: AdminClient,
): Promise<{ query: Query; empty: boolean }> {
  let q = applyOrdering(query, searchParams.get("order"));
  q = applyPagination(q, searchParams.get("limit"), searchParams.get("offset"));
  q = applyMultiWordSearch(
    q,
    searchParams.get("search_words"),
    searchParams.get("search_column") || "name",
  );
  q = await applySearchByTable(q, table, searchParams.get("search"), supabase);

  const catResult = await applyCategoryFilter(q, table, searchParams.get("category_id"), supabase);
  if (catResult.empty) return { query: q, empty: true };
  q = catResult.query;

  const orFilter = searchParams.get("or");
  if (orFilter) q = q.or(orFilter);

  q = applyOperatorFilters(q, searchParams);
  return { query: q, empty: false };
}

export function buildEmptyListResponse(wantCount: boolean): NextResponse {
  const response = NextResponse.json([]);
  if (wantCount) response.headers.set("X-Total-Count", "0");
  return response;
}

export function buildListResponse(
  data: unknown,
  count: number | null | undefined,
  wantCount: boolean,
): NextResponse {
  const response = NextResponse.json(data);
  if (wantCount && count !== null && count !== undefined) {
    response.headers.set("X-Total-Count", count.toString());
  }
  return response;
}
