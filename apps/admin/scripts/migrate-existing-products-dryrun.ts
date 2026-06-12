import { readFile } from "fs/promises";

import { createClient } from "@supabase/supabase-js";

// Configuration
const DATA_FILE = "/Users/dashka/Downloads/NewProduct (1)/new_products.json";
const SUPABASE_URL = "https://qtpfavodqjyosdnxjwjq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o";

// Types
interface ProductJSON {
  title: string;
  url: string;
  localImages?: string[];
}

interface DBProduct {
  id: string;
  name: string;
  original_url: string;
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeProduct(dbProduct: DBProduct, jsonProduct: ProductJSON) {
  const localImages = jsonProduct.localImages || [];
  if (localImages.length === 0) {
    return {
      productName: dbProduct.name,
      currentMainCount: 0,
      newMainCount: 0,
      newDescCount: 0,
    };
  }

  // Fetch current product images
  const { data: currentImages } = await supabase
    .from("product_images")
    .select("id, product_id, url, sort_order, is_primary")
    .eq("product_id", dbProduct.id)
    .order("sort_order", { ascending: true });

  if (!currentImages || currentImages.length === 0) {
    return {
      productName: dbProduct.name,
      currentMainCount: 0,
      newMainCount: 0,
      newDescCount: 0,
    };
  }

  // Match and analyze
  const minLength = Math.min(currentImages.length, localImages.length);
  let newMainCount = 0;
  let newDescCount = 0;

  for (let i = 0; i < minLength; i++) {
    const hasT = localImages[i].includes("_t");
    if (hasT) {
      newMainCount++;
    } else {
      newDescCount++;
    }
  }

  return {
    productName: dbProduct.name,
    currentMainCount: currentImages.length,
    newMainCount,
    newDescCount,
  };
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              DRY RUN - Preview Migration Changes              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  try {
    // Load products from JSON
    console.log("Loading products from JSON...");
    const jsonContent = await readFile(DATA_FILE, "utf-8");
    const jsonData = JSON.parse(jsonContent);
    const jsonProducts: ProductJSON[] = jsonData.products;
    console.log(`Loaded ${jsonProducts.length} products from JSON\n`);

    // Create map
    const jsonProductMap = new Map<string, ProductJSON>();
    jsonProducts.forEach((p) => {
      jsonProductMap.set(p.url, p);
    });

    // Fetch from database
    console.log("Fetching imported products from database...");
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
      console.log("No products found.");
      return;
    }

    console.log(`Found ${dbProducts.length} products\n`);

    // Match products
    const matched: Array<{ db: DBProduct; json: ProductJSON }> = [];
    dbProducts.forEach((dbProduct) => {
      const jsonProduct = jsonProductMap.get(dbProduct.original_url);
      if (jsonProduct) {
        matched.push({ db: dbProduct, json: jsonProduct });
      }
    });

    console.log(`Analyzing ${matched.length} matched products...\n`);

    // Analyze first 10 products in detail
    console.log("Sample Analysis (first 10 products):\n");
    for (let i = 0; i < Math.min(10, matched.length); i++) {
      const { db, json } = matched[i];
      const analysis = await analyzeProduct(db, json);
      console.log(`${i + 1}. ${analysis.productName}`);
      console.log(`   Current: ${analysis.currentMainCount} main images`);
      console.log(`   After:   ${analysis.newMainCount} main, ${analysis.newDescCount} desc`);
      console.log(
        `   Change:  ${analysis.currentMainCount - analysis.newMainCount} images moved to description\n`,
      );
    }

    // Overall statistics
    let totalCurrentMain = 0;
    let totalNewMain = 0;
    let totalNewDesc = 0;

    console.log("Analyzing all products...");
    for (const { db, json } of matched) {
      const analysis = await analyzeProduct(db, json);
      totalCurrentMain += analysis.currentMainCount;
      totalNewMain += analysis.newMainCount;
      totalNewDesc += analysis.newDescCount;
    }

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                     Migration Preview                         ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log("\nOverall Statistics:");
    console.log("─────────────────────────────────");
    console.log(`Products to migrate:      ${matched.length}`);
    console.log(`\nCurrent state:`);
    console.log(`  Main images (p_images): ${totalCurrentMain}`);
    console.log(`  Desc images:            0`);
    console.log(`\nAfter migration:`);
    console.log(`  Main images (p_images): ${totalNewMain}`);
    console.log(`  Desc images (rich_desc): ${totalNewDesc}`);
    console.log(`\nChanges:`);
    console.log(`  Images to move:         ${totalNewDesc}`);
    console.log(`  Images to keep:         ${totalNewMain}`);
    console.log("─────────────────────────────────\n");

    console.log("✅ Dry run complete!");
    console.log("\nTo execute the actual migration, run:");
    console.log("  npx tsx scripts/migrate-existing-products.ts\n");
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
