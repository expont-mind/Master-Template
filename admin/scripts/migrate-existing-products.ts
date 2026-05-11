import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';

// Configuration
const DATA_FILE = '/Users/dashka/Downloads/NewProduct (1)/new_products.json';
const SUPABASE_URL = 'https://qtpfavodqjyosdnxjwjq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o';

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

interface MigrationResult {
  productName: string;
  success: boolean;
  mainImageCount?: number;
  descImageCount?: number;
  error?: string;
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateProduct(
  dbProduct: DBProduct,
  jsonProduct: ProductJSON
): Promise<MigrationResult> {
  try {
    const localImages = jsonProduct.localImages || [];
    if (localImages.length === 0) {
      return {
        productName: dbProduct.name,
        success: true,
        mainImageCount: 0,
        descImageCount: 0,
      };
    }

    // Fetch current product images from database (ordered by sort_order)
    const { data: currentImages, error: fetchError } = await supabase
      .from('product_images')
      .select('id, product_id, url, sort_order, is_primary')
      .eq('product_id', dbProduct.id)
      .order('sort_order', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch images: ${fetchError.message}`);
    }

    if (!currentImages || currentImages.length === 0) {
      return {
        productName: dbProduct.name,
        success: true,
        mainImageCount: 0,
        descImageCount: 0,
      };
    }

    // Match images by order (assuming they were uploaded in the same order as JSON)
    const imageMatches: Array<{
      dbImage: ProductImage;
      originalFilename: string;
      hasT: boolean;
    }> = [];

    const minLength = Math.min(currentImages.length, localImages.length);
    for (let i = 0; i < minLength; i++) {
      const originalFilename = localImages[i];
      const hasT = originalFilename.includes('_t');
      imageMatches.push({
        dbImage: currentImages[i],
        originalFilename,
        hasT,
      });
    }

    // Separate into main and description images
    const mainImageMatches = imageMatches.filter((m) => m.hasT);
    const descImageMatches = imageMatches.filter((m) => !m.hasT);

    // Delete description images from product_images table
    if (descImageMatches.length > 0) {
      const descImageIds = descImageMatches.map((m) => m.dbImage.id);
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .in('id', descImageIds);

      if (deleteError) {
        throw new Error(`Failed to delete desc images: ${deleteError.message}`);
      }
    }

    // Update sort_order for remaining main images
    if (mainImageMatches.length > 0) {
      for (let i = 0; i < mainImageMatches.length; i++) {
        const { error: updateError } = await supabase
          .from('product_images')
          .update({
            sort_order: i,
            is_primary: i === 0,
          })
          .eq('id', mainImageMatches[i].dbImage.id);

        if (updateError) {
          throw new Error(`Failed to update image sort_order: ${updateError.message}`);
        }
      }
    }

    // Update/create rich_description with description images
    if (descImageMatches.length > 0) {
      const descImageUrls = descImageMatches.map((m) => m.dbImage.url);

      // Check if rich_description already exists
      const { data: existing } = await supabase
        .from('product_rich_descriptions')
        .select('id, content')
        .eq('product_id', dbProduct.id)
        .single();

      if (existing) {
        // Update existing rich_description
        const { error: updateError } = await supabase
          .from('product_rich_descriptions')
          .update({ images: descImageUrls })
          .eq('id', existing.id);

        if (updateError) {
          throw new Error(`Failed to update rich_description: ${updateError.message}`);
        }
      } else {
        // Create new rich_description
        const { error: insertError } = await supabase
          .from('product_rich_descriptions')
          .insert({
            product_id: dbProduct.id,
            content: '',
            images: descImageUrls,
          });

        if (insertError) {
          throw new Error(`Failed to insert rich_description: ${insertError.message}`);
        }
      }
    }

    return {
      productName: dbProduct.name,
      success: true,
      mainImageCount: mainImageMatches.length,
      descImageCount: descImageMatches.length,
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

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        Migrate Existing Products - Separate Images             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Load products from JSON
    console.log('Loading products from JSON...');
    const jsonContent = await readFile(DATA_FILE, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    const jsonProducts: ProductJSON[] = jsonData.products;
    console.log(`Loaded ${jsonProducts.length} products from JSON\n`);

    // 2. Create a map of JSON products by URL for quick lookup
    const jsonProductMap = new Map<string, ProductJSON>();
    jsonProducts.forEach((p) => {
      jsonProductMap.set(p.url, p);
    });

    // 3. Fetch products from database (those with original_url set - imported products)
    console.log('Fetching imported products from database...');
    const { data: dbProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name, original_url')
      .not('original_url', 'is', null)
      .gte('created_at', '2026-02-10')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    if (!dbProducts || dbProducts.length === 0) {
      console.log('No products found to migrate.');
      return;
    }

    console.log(`Found ${dbProducts.length} products to migrate\n`);

    // 4. Match database products with JSON products
    const matchedProducts: Array<{ db: DBProduct; json: ProductJSON }> = [];
    const unmatchedProducts: DBProduct[] = [];

    dbProducts.forEach((dbProduct) => {
      const jsonProduct = jsonProductMap.get(dbProduct.original_url);
      if (jsonProduct) {
        matchedProducts.push({ db: dbProduct, json: jsonProduct });
      } else {
        unmatchedProducts.push(dbProduct);
      }
    });

    console.log(`Matched: ${matchedProducts.length} products`);
    console.log(`Unmatched: ${unmatchedProducts.length} products\n`);

    if (unmatchedProducts.length > 0) {
      console.log('⚠️  Unmatched products (will be skipped):');
      unmatchedProducts.forEach((p) => {
        console.log(`  - ${p.name}`);
      });
      console.log('');
    }

    // 5. Migrate each matched product
    console.log(`Starting migration of ${matchedProducts.length} products...\n`);

    const results: MigrationResult[] = [];
    let processedCount = 0;

    for (const { db, json } of matchedProducts) {
      processedCount++;
      const result = await migrateProduct(db, json);
      results.push(result);

      if (result.success) {
        console.log(
          `✓ [${processedCount}/${matchedProducts.length}] ${result.productName} - Main: ${result.mainImageCount}, Desc: ${result.descImageCount}`
        );
      } else {
        console.log(
          `✗ [${processedCount}/${matchedProducts.length}] ${result.productName} - Error: ${result.error}`
        );
      }

      // Progress update every 25 products
      if (processedCount % 25 === 0) {
        const successCount = results.filter((r) => r.success).length;
        console.log(
          `\n  Progress: ${processedCount}/${matchedProducts.length} (${successCount} successful)\n`
        );
      }
    }

    // 6. Generate final report
    const successResults = results.filter((r) => r.success);
    const failedResults = results.filter((r) => !r.success);

    const totalMainImages = successResults.reduce((sum, r) => sum + (r.mainImageCount || 0), 0);
    const totalDescImages = successResults.reduce((sum, r) => sum + (r.descImageCount || 0), 0);

    const elapsedMs = Date.now() - startTime;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     Migration Complete!                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\nSummary:');
    console.log('─────────────────────────────────');
    console.log(`Products in database:     ${dbProducts.length}`);
    console.log(`Matched with JSON:        ${matchedProducts.length}`);
    console.log(`Successfully migrated:    ${successResults.length}`);
    console.log(`Failed:                   ${failedResults.length}`);
    console.log('─────────────────────────────────');
    console.log(`Total main images:        ${totalMainImages}`);
    console.log(`Total desc images:        ${totalDescImages}`);
    console.log('─────────────────────────────────');
    console.log(`Time elapsed: ${elapsedMin}m ${elapsedSec}s\n`);

    if (failedResults.length > 0) {
      console.log('❌ Failed products:');
      failedResults.forEach((r) => {
        console.log(`  - "${r.productName}"`);
        console.log(`    Error: ${r.error}`);
      });
      console.log('');
    }

    console.log('✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify a few products in the admin UI');
    console.log('2. Check that main images show only _t images');
    console.log('3. Check that "Дэлгэрэнгүй тайлбар" shows description images\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
