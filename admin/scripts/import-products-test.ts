import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { generateSlug } from './lib/generate-slug.js';

// Configuration
const DATA_FILE = '/Users/dashka/Downloads/NewProduct (1)/new_products.json';
const IMAGES_DIR = '/Users/dashka/Downloads/NewProduct (1)/';
const TEST_OFFSET = 150; // Skip first 150 products (already imported)
const TEST_LIMIT = 3; // Only process 3 products from offset
const MAX_CONCURRENT_UPLOADS = 5;
const SESSION_ID = new Date().toISOString();

// Supabase configuration
const SUPABASE_URL = 'https://qtpfavodqjyosdnxjwjq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o';

// Types
interface ProductJSON {
  title: string;
  price: number;
  url: string;
  description: string;
  localImages?: string[];
  brand?: string;
}

interface ImportResult {
  success: boolean;
  productName: string;
  url: string;
  error?: string;
  imageCount?: number;
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper: Upload chunk of images concurrently
async function uploadImagesChunk(imagePaths: string[]): Promise<Array<{ url: string; original: string }>> {
  const results = await Promise.allSettled(
    imagePaths.map(async (imagePath) => {
      try {
        const fullPath = resolve(IMAGES_DIR, imagePath);
        const fileBuffer = await readFile(fullPath);

        // Determine file type from extension
        const ext = imagePath.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

        // Create a Blob from the buffer
        const blob = new Blob([fileBuffer], { type: mimeType });

        // Generate unique filename
        const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

        // Upload to Supabase storage
        const { error } = await supabase.storage
          .from('images')
          .upload(filename, blob, {
            contentType: mimeType,
            upsert: false,
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filename);

        return { url: urlData.publicUrl, original: imagePath };
      } catch (error) {
        console.error(`  ⚠️  Failed to upload ${imagePath}:`, error instanceof Error ? error.message : error);
        return null;
      }
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ url: string; original: string } | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((item): item is { url: string; original: string } => item !== null);
}

// Helper: Upload all images for a product (max 5 concurrent)
async function uploadProductImages(localImages: string[]): Promise<Array<{ url: string; original: string }>> {
  const results: Array<{ url: string; original: string }> = [];

  for (let i = 0; i < localImages.length; i += MAX_CONCURRENT_UPLOADS) {
    const chunk = localImages.slice(i, i + MAX_CONCURRENT_UPLOADS);
    const chunkResults = await uploadImagesChunk(chunk);
    results.push(...chunkResults);
  }

  return results;
}

// Helper: Save product using RPC
async function saveProduct(product: ProductJSON, uploadedImages: Array<{ url: string; original: string }>): Promise<void> {
  const p_product = {
    id: null,
    name: product.title.trim(),
    slug: generateSlug(product.title),
    description: product.description?.trim() || null,
    price: product.price,
    discount_price: null,
    stock_quantity: 0,
    status: 'draft',
    brand_id: null,
    original_url: product.url.trim(),
  };

  const p_variants: any[] = [];

  // Separate images by type based on _t prefix
  const mainImages = uploadedImages.filter((img) => img.original.includes('_t'));
  const descImages = uploadedImages.filter((img) => !img.original.includes('_t'));

  // Main product images (with _t prefix)
  const p_images = mainImages.map((img, idx) => ({
    url: img.url,
    is_primary: idx === 0,
    sort_order: idx,
  }));

  // Rich description with images (without _t prefix)
  const p_rich_description = descImages.length > 0
    ? { content: '', images: descImages.map((img) => img.url) }
    : null;

  const p_category_ids: string[] = [];
  const p_details: any[] = [];
  const p_option_groups = null;

  const { error } = await supabase.rpc('save_product', {
    p_product,
    p_variants,
    p_images,
    p_category_ids,
    p_details,
    p_rich_description,
    p_option_groups,
  });

  if (error) {
    throw new Error(`RPC call failed: ${error.message}`);
  }
}

// Helper: Process a single product
async function processProduct(product: ProductJSON, index: number): Promise<ImportResult> {
  try {
    console.log(`\n[${index + 1}/${TEST_LIMIT}] Processing: ${product.title}`);

    // Upload images
    const localImages = product.localImages || [];
    if (localImages.length === 0) {
      throw new Error('No images to upload');
    }

    console.log(`  → Uploading ${localImages.length} images...`);
    const uploadedImages = await uploadProductImages(localImages);

    if (uploadedImages.length === 0) {
      throw new Error('All image uploads failed');
    }

    console.log(`  → Successfully uploaded ${uploadedImages.length} images`);

    // Save product
    console.log(`  → Saving product to database...`);
    await saveProduct(product, uploadedImages);

    console.log(`  ✓ Success!`);

    return {
      success: true,
      productName: product.title,
      url: product.url,
      imageCount: uploadedImages.length,
    };
  } catch (error) {
    console.log(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      productName: product.title,
      url: product.url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Main function
async function main() {
  const startTime = Date.now();

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TEST RUN - Testing Image Separation (3 Products)      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Load products from JSON
    console.log('Loading products from JSON...');
    const jsonContent = await readFile(DATA_FILE, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    const allProducts: ProductJSON[] = jsonData.products;
    console.log(`Loaded ${allProducts.length} products`);
    console.log(`Testing with products ${TEST_OFFSET + 1}-${TEST_OFFSET + TEST_LIMIT} (offset: ${TEST_OFFSET})\n`);

    // 2. Get test products from offset
    const testProducts = allProducts.slice(TEST_OFFSET, TEST_OFFSET + TEST_LIMIT);

    // 3. Check which ones already exist
    console.log('Checking for duplicates...');
    const urls = testProducts.map(p => p.url);
    const { data: existing, error: queryError } = await supabase
      .from('products')
      .select('original_url')
      .in('original_url', urls);

    if (queryError) {
      throw new Error(`Failed to query existing products: ${queryError.message}`);
    }

    const existingUrls = new Set(existing?.map(p => p.original_url) || []);
    const newProducts = testProducts.filter(p => !existingUrls.has(p.url));

    console.log(`Found ${existingUrls.size} existing products in this batch`);
    console.log(`New products to import: ${newProducts.length}\n`);

    if (newProducts.length === 0) {
      console.log('⚠️  All test products already exist. No import needed.');
      console.log('\nTo test with different products, delete existing ones or modify TEST_LIMIT.');
      return;
    }

    // 4. Process each product sequentially (easier to track progress in test mode)
    const allResults: ImportResult[] = [];

    for (let i = 0; i < newProducts.length; i++) {
      const result = await processProduct(newProducts[i], i);
      allResults.push(result);
    }

    // 5. Generate final report
    const successResults = allResults.filter(r => r.success);
    const failedResults = allResults.filter(r => !r.success);

    const elapsedMs = Date.now() - startTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        Test Complete!                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\nTest Results:');
    console.log('─────────────────────────────────');
    console.log(`Test batch (offset):  ${TEST_OFFSET + 1}-${TEST_OFFSET + TEST_LIMIT}`);
    console.log(`Already existed:     ${existingUrls.size}`);
    console.log(`Attempted:           ${newProducts.length}`);
    console.log(`Successful:          ${successResults.length}`);
    console.log(`Failed:              ${failedResults.length}`);
    console.log('─────────────────────────────────');
    console.log(`Time elapsed: ${elapsedSec}s\n`);

    if (successResults.length > 0) {
      console.log('✅ Successfully imported products:');
      successResults.forEach(r => {
        console.log(`  - "${r.productName}" (${r.imageCount} images)`);
      });
      console.log('');
    }

    if (failedResults.length > 0) {
      console.log('❌ Failed products:');
      failedResults.forEach(r => {
        console.log(`  - "${r.productName}"`);
        console.log(`    Error: ${r.error}`);
      });
      console.log('');
    }

    if (successResults.length === newProducts.length) {
      console.log('🎉 Test passed! All products imported successfully with separated images.');
      console.log('\nThe fix is working correctly:');
      console.log('  - Images with _t prefix → Main product images (p_images)');
      console.log('  - Images without _t prefix → Rich description images (p_rich_description.images)');
      console.log('\nTo run the full import (156 products), use:');
      console.log('  npx tsx scripts/import-products.ts\n');
    } else {
      console.log('⚠️  Some products failed. Please review errors above before running full import.\n');
    }

    console.log('To view imported products:');
    console.log('http://localhost:3002/products?status=draft\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
