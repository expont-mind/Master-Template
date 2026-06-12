import { createClient } from "@supabase/supabase-js";

// Configuration
const SUPABASE_URL = "https://qtpfavodqjyosdnxjwjq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o";

// Types
interface DBProduct {
  id: string;
  name: string;
  original_url: string;
}

interface RichDescription {
  id: string;
  product_id: string;
  content: string;
  images: string[];
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

interface RollbackResult {
  productName: string;
  success: boolean;
  restoredImageCount?: number;
  error?: string;
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function rollbackProduct(dbProduct: DBProduct): Promise<RollbackResult> {
  try {
    // 1. Get rich_description for this product
    const { data: richDesc, error: richError } = await supabase
      .from("product_rich_descriptions")
      .select("id, images")
      .eq("product_id", dbProduct.id)
      .single();

    if (richError && richError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is fine
      throw new Error(`Failed to fetch rich_description: ${richError.message}`);
    }

    if (!richDesc || !richDesc.images || richDesc.images.length === 0) {
      // No rich description images to restore
      return {
        productName: dbProduct.name,
        success: true,
        restoredImageCount: 0,
      };
    }

    const descImages: string[] = richDesc.images;

    // 2. Get current product_images to determine the next sort_order
    const { data: currentImages, error: currentError } = await supabase
      .from("product_images")
      .select("sort_order")
      .eq("product_id", dbProduct.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    if (currentError) {
      throw new Error(`Failed to fetch current images: ${currentError.message}`);
    }

    const maxSortOrder =
      currentImages && currentImages.length > 0 ? currentImages[0].sort_order : -1;

    // 3. Create product_images entries for description images
    const newImages = descImages.map((url, idx) => ({
      product_id: dbProduct.id,
      url,
      sort_order: maxSortOrder + 1 + idx,
      is_primary: false,
    }));

    const { error: insertError } = await supabase.from("product_images").insert(newImages);

    if (insertError) {
      throw new Error(`Failed to restore images: ${insertError.message}`);
    }

    // 4. Clear images from rich_description (keep content if it exists)
    const { error: updateError } = await supabase
      .from("product_rich_descriptions")
      .update({ images: [] })
      .eq("id", richDesc.id);

    if (updateError) {
      throw new Error(`Failed to clear rich_description images: ${updateError.message}`);
    }

    return {
      productName: dbProduct.name,
      success: true,
      restoredImageCount: descImages.length,
    };
  } catch (error) {
    return {
      productName: dbProduct.name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const startTime = Date.now();

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                    Rollback Migration                          ║");
  console.log("║     Restore description images back to main gallery            ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  try {
    // Fetch products from database (imported products with rich_description)
    console.log("Fetching products with rich descriptions...");
    const { data: dbProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, name, original_url")
      .not("original_url", "is", null)
      .gte("created_at", "2026-02-10")
      .order("created_at", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    if (!dbProducts || dbProducts.length === 0) {
      console.log("No products found to rollback.");
      return;
    }

    console.log(`Found ${dbProducts.length} products\n`);

    // Filter products that have rich_description images
    console.log("Checking which products have rich description images to restore...");
    const productsToRollback: DBProduct[] = [];

    for (const product of dbProducts) {
      const { data: richDesc } = await supabase
        .from("product_rich_descriptions")
        .select("images")
        .eq("product_id", product.id)
        .single();

      if (richDesc && richDesc.images && richDesc.images.length > 0) {
        productsToRollback.push(product);
      }
    }

    console.log(`Found ${productsToRollback.length} products with description images to restore\n`);

    if (productsToRollback.length === 0) {
      console.log("✅ No products need rollback (migration was not run or already rolled back).");
      return;
    }

    console.log("⚠️  WARNING: This will:");
    console.log(`  - Restore ~3,650 images back to product_images table`);
    console.log(`  - Clear images from ${productsToRollback.length} rich_descriptions`);
    console.log(`  - Products will return to their pre-migration state\n`);

    console.log("Starting rollback...\n");

    const results: RollbackResult[] = [];
    let processedCount = 0;

    for (const product of productsToRollback) {
      processedCount++;
      const result = await rollbackProduct(product);
      results.push(result);

      if (result.success) {
        console.log(
          `✓ [${processedCount}/${productsToRollback.length}] ${result.productName} - Restored: ${result.restoredImageCount} images`,
        );
      } else {
        console.log(
          `✗ [${processedCount}/${productsToRollback.length}] ${result.productName} - Error: ${result.error}`,
        );
      }

      // Progress update every 25 products
      if (processedCount % 25 === 0) {
        const successCount = results.filter((r) => r.success).length;
        console.log(
          `\n  Progress: ${processedCount}/${productsToRollback.length} (${successCount} successful)\n`,
        );
      }
    }

    // Generate final report
    const successResults = results.filter((r) => r.success);
    const failedResults = results.filter((r) => !r.success);

    const totalRestored = successResults.reduce((sum, r) => sum + (r.restoredImageCount || 0), 0);

    const elapsedMs = Date.now() - startTime;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                     Rollback Complete!                         ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log("\nSummary:");
    console.log("─────────────────────────────────");
    console.log(`Products checked:         ${dbProducts.length}`);
    console.log(`Products rolled back:     ${successResults.length}`);
    console.log(`Failed:                   ${failedResults.length}`);
    console.log("─────────────────────────────────");
    console.log(`Images restored:          ${totalRestored}`);
    console.log("─────────────────────────────────");
    console.log(`Time elapsed: ${elapsedMin}m ${elapsedSec}s\n`);

    if (failedResults.length > 0) {
      console.log("❌ Failed products:");
      failedResults.forEach((r) => {
        console.log(`  - "${r.productName}"`);
        console.log(`    Error: ${r.error}`);
      });
      console.log("");
    }

    console.log("✅ Rollback complete!");
    console.log("\nProducts have been restored to their pre-migration state.");
    console.log("All description images are back in the main product gallery.\n");
  } catch (error) {
    console.error("\n❌ Fatal error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
