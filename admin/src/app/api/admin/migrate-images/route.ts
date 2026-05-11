import { createAdminClient } from "@/lib/supabase/server";
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
      console.error(`Upload failed for ${url}:`, error.message);
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error(`Failed to migrate ${url}:`, err);
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

      // Build OR filter for cloudinary URLs across all columns
      const { data: rows, error } = await supabase
        .from(table)
        .select(`id, ${columns.join(", ")}`);

      if (error) {
        console.error(`Failed to query ${table}:`, error.message);
        continue;
      }

      if (!rows || rows.length === 0) continue;

      // Filter rows that have cloudinary URLs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloudinaryRows = rows.filter((row: any) =>
        columns.some((col) => {
          const val = row[col];
          return typeof val === "string" && val.includes("cloudinary.com");
        })
      );

      results[table].total = cloudinaryRows.length;

      // Process in batches
      for (let i = 0; i < cloudinaryRows.length; i += BATCH_SIZE) {
        const batch = cloudinaryRows.slice(i, i + BATCH_SIZE);

        for (const row of batch) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updates: Record<string, any> = {};
          let hasUpdate = false;

          for (const col of columns) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const oldUrl = (row as any)[col];
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: updateError } = await (supabase as any)
              .from(table)
              .update(updates)
              .eq("id", (row as Record<string, unknown>).id);

            if (updateError) {
              console.error(`Failed to update ${table}/${(row as Record<string, unknown>).id}:`, updateError.message);
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
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
