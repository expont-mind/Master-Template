import { createAdminClient } from "@/lib/supabase/server";
import { log } from "@/lib/observability/log";
import { NextResponse } from "next/server";

interface MigrationTarget {
  table: string;
  columns: string[];
}

const TARGETS: MigrationTarget[] = [
  { table: "product_images", columns: ["url"] },
  { table: "brands", columns: ["logo_url"] },
  { table: "categories", columns: ["image"] },
  { table: "ads", columns: ["image_url"] },
  { table: "banners", columns: ["image_url", "image_url_mobile"] },
  { table: "bank_accounts", columns: ["logo_url"] },
  { table: "social_links", columns: ["icon_url"] },
  { table: "product_attribute_values", columns: ["image_url"] },
];

const BATCH_SIZE = 50;

async function downloadAndUpload(
  supabase: ReturnType<typeof createAdminClient>,
  url: string
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
      log.error("migrate_images_upload_failed", { url, message: error.message });
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    log.error("migrate_images_failed", { url, error: err });
    return null;
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient();
    const results: Record<string, { total: number; migrated: number; failed: number }> = {};

    for (const target of TARGETS) {
      const { table, columns } = target;
      results[table] = { total: 0, migrated: 0, failed: 0 };

      // This route migrates URL columns across many tables. The table
      // name is a runtime string, so the Supabase typed client can't
      // narrow per-call — we work with a Row of unknown columns and
      // cast at the dynamic-update boundary.
      type ImageRow = { id: string } & Record<string, unknown>;

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
        continue;
      }

      if (!rows || rows.length === 0) continue;

      const cloudinaryRows = rows.filter((row) =>
        columns.some((col) => {
          const val = row[col];
          return typeof val === "string" && val.includes("cloudinary.com");
        }),
      );

      results[table].total = cloudinaryRows.length;

      for (let i = 0; i < cloudinaryRows.length; i += BATCH_SIZE) {
        const batch = cloudinaryRows.slice(i, i + BATCH_SIZE);

        for (const row of batch) {
          const updates: Record<string, string> = {};
          let hasUpdate = false;

          for (const col of columns) {
            const oldUrl = row[col];
            if (typeof oldUrl !== "string" || !oldUrl.includes("cloudinary.com")) {
              continue;
            }

            const newUrl = await downloadAndUpload(supabase, oldUrl);
            if (newUrl) {
              updates[col] = newUrl;
              hasUpdate = true;
            } else {
              results[table].failed++;
            }
          }

          if (hasUpdate) {
            const { error: updateError } = await (
              supabase as unknown as {
                from: (t: string) => {
                  update: (vals: Record<string, string>) => {
                    eq: (col: string, val: string) => PromiseLike<{
                      error: { message: string } | null;
                    }>;
                  };
                };
              }
            )
              .from(table)
              .update(updates)
              .eq("id", row.id);

            if (updateError) {
              log.error("migrate_images_update_failed", { table, id: row.id, message: updateError.message });
              results[table].failed++;
            } else {
              results[table].migrated++;
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    log.error("migrate_images_unhandled_error", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
