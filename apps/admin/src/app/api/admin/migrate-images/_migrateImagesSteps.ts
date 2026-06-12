import { log } from "@/lib/observability/log";

import type { createAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ImageRow = { id: string } & Record<string, unknown>;

export interface MigrationTarget {
  table: string;
  columns: string[];
}

export interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
}

export const TARGETS: MigrationTarget[] = [
  { table: "product_images", columns: ["url"] },
  { table: "brands", columns: ["logo_url"] },
  { table: "categories", columns: ["image"] },
  { table: "ads", columns: ["image_url"] },
  { table: "banners", columns: ["image_url", "image_url_mobile"] },
  { table: "bank_accounts", columns: ["logo_url"] },
  { table: "social_links", columns: ["icon_url"] },
  { table: "product_attribute_values", columns: ["image_url"] },
];

const CLOUDINARY_HOST = "cloudinary.com";

function isCloudinaryString(val: unknown): val is string {
  return typeof val === "string" && val.includes(CLOUDINARY_HOST);
}

export async function downloadAndUpload(
  supabase: AdminClient,
  url: string,
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const path = `migrated/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(path, buffer, { contentType, upsert: false });

    if (error) {
      log.error("migrate_images_upload_failed", {
        url,
        message: error.message,
      });
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    log.error("migrate_images_failed", { url, error: err });
    return null;
  }
}

export async function fetchLegacyRows(
  supabase: AdminClient,
  table: string,
  columns: string[],
): Promise<ImageRow[] | null> {
  // This route migrates URL columns across many tables. The table
  // name is a runtime string, so the Supabase typed client can't
  // narrow per-call — we work with a Row of unknown columns and
  // cast at the dynamic-update boundary.
  const { data: rows, error } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => PromiseLike<{
          data: ImageRow[] | null;
          error: { message: string } | null;
        }>;
      };
    }
  )
    .from(table)
    .select(`id, ${columns.join(", ")}`);

  if (error) {
    log.error("migrate_images_query_failed", { table, message: error.message });
    return null;
  }
  return rows ?? [];
}

export function filterCloudinaryRows(rows: ImageRow[], columns: string[]): ImageRow[] {
  return rows.filter((row) => columns.some((col) => isCloudinaryString(row[col])));
}

export async function buildRowUpdates(
  supabase: AdminClient,
  row: ImageRow,
  columns: string[],
  stats: MigrationStats,
): Promise<Record<string, string>> {
  const updates: Record<string, string> = {};
  for (const col of columns) {
    const oldUrl = row[col];
    if (!isCloudinaryString(oldUrl)) continue;

    const newUrl = await downloadAndUpload(supabase, oldUrl);
    if (newUrl) {
      updates[col] = newUrl;
    } else {
      stats.failed++;
    }
  }
  return updates;
}

export async function applyRowUpdate(
  supabase: AdminClient,
  table: string,
  rowId: string,
  updates: Record<string, string>,
  stats: MigrationStats,
): Promise<void> {
  const { error: updateError } = await (
    supabase as unknown as {
      from: (t: string) => {
        update: (vals: Record<string, string>) => {
          eq: (
            col: string,
            val: string,
          ) => PromiseLike<{
            error: { message: string } | null;
          }>;
        };
      };
    }
  )
    .from(table)
    .update(updates)
    .eq("id", rowId);

  if (updateError) {
    log.error("migrate_images_update_failed", {
      table,
      id: rowId,
      message: updateError.message,
    });
    stats.failed++;
  } else {
    stats.migrated++;
  }
}

export async function migrateTable(
  supabase: AdminClient,
  target: MigrationTarget,
): Promise<MigrationStats> {
  const stats: MigrationStats = { total: 0, migrated: 0, failed: 0 };
  const { table, columns } = target;

  const rows = await fetchLegacyRows(supabase, table, columns);
  if (!rows || rows.length === 0) return stats;

  const cloudinaryRows = filterCloudinaryRows(rows, columns);
  stats.total = cloudinaryRows.length;

  const BATCH_SIZE = 50;
  for (let i = 0; i < cloudinaryRows.length; i += BATCH_SIZE) {
    const batch = cloudinaryRows.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      const updates = await buildRowUpdates(supabase, row, columns, stats);
      if (Object.keys(updates).length > 0) {
        await applyRowUpdate(supabase, table, row.id, updates, stats);
      }
    }
  }
  return stats;
}
