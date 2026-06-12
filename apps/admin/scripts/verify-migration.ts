import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qtpfavodqjyosdnxjwjq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                  Verifying Migration Results                   ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // Check 3 sample products
  const sampleNames = [
    "Mise En Scene Curling Essence 2X, 230ml /Үсний серум/ OY",
    "Fully Rice Cera Moisturizing Sunscreen, 50ml /Нарны тос/ OY",
    "Bano Bagi Vita Genic Jelly Mask, 10p /Салфеткан маск/",
  ];

  for (const name of sampleNames) {
    const { data: product } = await supabase
      .from("products")
      .select("id, name")
      .eq("name", name)
      .single();

    if (!product) {
      console.log(`❌ Product not found: ${name}\n`);
      continue;
    }

    // Get main images count
    const { count: mainCount } = await supabase
      .from("product_images")
      .select("*", { count: "exact", head: true })
      .eq("product_id", product.id);

    // Get rich description
    const { data: richDesc } = await supabase
      .from("product_rich_descriptions")
      .select("images")
      .eq("product_id", product.id)
      .single();

    const descCount = richDesc?.images?.length || 0;

    console.log(`✓ ${product.name}`);
    console.log(`  Main images (p_images): ${mainCount}`);
    console.log(`  Description images: ${descCount}`);
    console.log(`  Total: ${(mainCount || 0) + descCount}\n`);
  }

  // Overall statistics
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .not("original_url", "is", null)
    .gte("created_at", "2026-02-10");

  const { count: totalMainImages } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true });

  const { count: totalRichDesc } = await supabase
    .from("product_rich_descriptions")
    .select("*", { count: "exact", head: true })
    .not("images", "is", null);

  console.log("─────────────────────────────────────────────────────────");
  console.log("Overall Statistics:");
  console.log("─────────────────────────────────────────────────────────");
  console.log(`Migrated products: ${totalProducts}`);
  console.log(`Total product_images: ${totalMainImages}`);
  console.log(`Products with rich descriptions: ${totalRichDesc}`);
  console.log("─────────────────────────────────────────────────────────\n");

  console.log("✅ Migration verification complete!");
  console.log("\nTo view in admin UI:");
  console.log("http://localhost:3002/products?date_from=2026-02-10\n");
}

main().catch(console.error);
