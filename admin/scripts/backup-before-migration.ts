import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';

// Configuration
const SUPABASE_URL = 'https://qtpfavodqjyosdnxjwjq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o';

const BACKUP_FILE = '/Users/dashka/mine/code/monpang-web/admin/scripts/migration-backup.json';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              Creating Backup Before Migration                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Fetch all imported products
    console.log('Fetching products...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, original_url')
      .not('original_url', 'is', null)
      .gte('created_at', '2026-02-10')
      .order('created_at', { ascending: true });

    if (productError) {
      throw new Error(`Failed to fetch products: ${productError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('No products found.');
      return;
    }

    console.log(`Found ${products.length} products\n`);

    // Fetch all product_images for these products (in batches to avoid query limits)
    console.log('Fetching product images...');
    const productIds = products.map((p) => p.id);
    const allImages: any[] = [];

    // Fetch in batches of 50 to avoid potential query limits
    const batchSize = 50;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const { data: batchImages, error: imageError } = await supabase
        .from('product_images')
        .select('id, product_id, url, sort_order, is_primary')
        .in('product_id', batch)
        .order('product_id')
        .order('sort_order');

      if (imageError) {
        throw new Error(`Failed to fetch images: ${imageError.message}`);
      }

      if (batchImages) {
        allImages.push(...batchImages);
      }

      console.log(`  Fetched batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productIds.length / batchSize)}: ${batchImages?.length || 0} images`);
    }

    const images = allImages;
    console.log(`Total: ${images.length} product images\n`);

    // Fetch all rich_descriptions for these products
    console.log('Fetching rich descriptions...');
    const { data: richDescriptions, error: richError } = await supabase
      .from('product_rich_descriptions')
      .select('id, product_id, content, images')
      .in('product_id', productIds);

    if (richError) {
      throw new Error(`Failed to fetch rich descriptions: ${richError.message}`);
    }

    console.log(`Found ${richDescriptions?.length || 0} rich descriptions\n`);

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        original_url: p.original_url,
        images: images?.filter((img) => img.product_id === p.id) || [],
        rich_description: richDescriptions?.find((rd) => rd.product_id === p.id) || null,
      })),
      summary: {
        productCount: products.length,
        imageCount: images?.length || 0,
        richDescriptionCount: richDescriptions?.length || 0,
      },
    };

    // Save backup to file
    console.log(`Saving backup to ${BACKUP_FILE}...`);
    await writeFile(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf-8');

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     Backup Complete!                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\nBackup Summary:');
    console.log('─────────────────────────────────');
    console.log(`Products backed up:       ${backup.summary.productCount}`);
    console.log(`Images backed up:         ${backup.summary.imageCount}`);
    console.log(`Rich descriptions:        ${backup.summary.richDescriptionCount}`);
    console.log('─────────────────────────────────');
    console.log(`Backup file: ${BACKUP_FILE}\n`);

    console.log('✅ Backup created successfully!');
    console.log('\nYou can now safely run the migration.');
    console.log('If needed, use the rollback script to restore.\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
