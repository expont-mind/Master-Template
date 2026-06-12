import { NextRequest, NextResponse } from "next/server";

import { log } from "@/lib/observability/log";
import { createAdminClient } from "@/lib/supabase/server";

import {
  applyListBuilders,
  buildEmptyListResponse,
  buildInitialQuery,
  buildListResponse,
  fetchById,
} from "./_getHandlerSteps";
import { handleJunctionDelete, isJunctionTable } from "./_junctionDelete";
import { isValidTable } from "./_validTables";

// GET /api/admin/[table]
// GET /api/admin/[table]/[id]
// Supports query params: select, order, limit, offset, filters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table, id] = path;

    if (!isValidTable(table)) {
      return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const selectParam = searchParams.get("select") || "*";
    const wantCount = searchParams.get("count") === "exact";
    const initialQuery = buildInitialQuery(supabase, table, selectParam, wantCount);

    if (id) return fetchById(initialQuery, id);

    const listResult = await applyListBuilders(initialQuery, table, searchParams, supabase);
    if (listResult.empty) return buildEmptyListResponse(wantCount);

    const { data, error, count } = await listResult.query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return buildListResponse(data, count, wantCount);
  } catch (error) {
    log.error("admin_api_get_error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/[table]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table] = path;
    if (!isValidTable(table)) {
      return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const isArray = Array.isArray(body);
    const query = supabase.from(table).insert(body).select();
    const { data, error } = isArray ? await query : await query.single();

    if (error) {
      log.error("admin_api_post_table_error", { table, error });
      const detail = [error.message, error.details, error.hint].filter(Boolean).join(" | ");
      return NextResponse.json({ error: detail || error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    log.error("admin_api_post_error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/[table]/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table, id] = path;
    if (!isValidTable(table)) {
      return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ error: "ID is required for update" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    if (table === "products" && body.status !== undefined) {
      body.is_active = body.status === "active";
    }

    // Dynamic table proxy: `table` is validated above but Supabase's typed
    // client can't narrow the union from a runtime string. Cast to `never`
    // to opt out of column-shape checking; the route is documented as the
    // API surface that bypasses RLS.
    const { data, error } = await supabase
      .from(table)
      .update(body as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    log.error("admin_api_patch_error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/[table]/[id]
// For junction tables, use query params: ?product_id=xxx&category_id=yyy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table, id] = path;
    if (!isValidTable(table)) {
      return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    if (isJunctionTable(table)) {
      const junctionResponse = await handleJunctionDelete({
        supabase,
        table,
        searchParams,
      });
      if (junctionResponse) return junctionResponse;
    }

    if (!id) {
      return NextResponse.json({ error: "ID is required for delete" }, { status: 400 });
    }

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("admin_api_delete_error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
