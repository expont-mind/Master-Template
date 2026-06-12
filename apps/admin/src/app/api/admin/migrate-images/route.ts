import { NextResponse } from "next/server";

import { log } from "@/lib/observability/log";
import { createAdminClient } from "@/lib/supabase/server";

import { migrateTable, TARGETS, type MigrationStats } from "./_migrateImagesSteps";

export async function POST() {
  try {
    const supabase = createAdminClient();
    const results: Record<string, MigrationStats> = {};

    for (const target of TARGETS) {
      results[target.table] = await migrateTable(supabase, target);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    log.error("migrate_images_unhandled_error", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
