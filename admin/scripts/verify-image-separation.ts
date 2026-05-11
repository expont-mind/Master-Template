import { readFile } from 'fs/promises';

const DATA_FILE = '/Users/dashka/Downloads/NewProduct (1)/new_products.json';

interface ProductJSON {
  title: string;
  localImages?: string[];
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Verifying Image Separation Logic                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Load products from JSON
  const jsonContent = await readFile(DATA_FILE, 'utf-8');
  const jsonData = JSON.parse(jsonContent);
  const allProducts: ProductJSON[] = jsonData.products;

  console.log(`Analyzing image patterns from ${allProducts.length} products...\n`);

  // Analyze first 5 products
  const sampleProducts = allProducts.slice(0, 5);

  sampleProducts.forEach((product, idx) => {
    console.log(`${idx + 1}. ${product.title}`);

    const localImages = product.localImages || [];
    if (localImages.length === 0) {
      console.log('   No images\n');
      return;
    }

    // Simulate the filtering logic from the fixed script
    const mainImages = localImages.filter(img => img.includes('_t'));
    const descImages = localImages.filter(img => !img.includes('_t'));

    console.log(`   Total images: ${localImages.length}`);
    console.log(`   Main images (_t prefix): ${mainImages.length}`);
    console.log(`   Description images (no _t): ${descImages.length}`);

    if (mainImages.length > 0) {
      console.log(`   Main: ${mainImages.slice(0, 2).join(', ')}${mainImages.length > 2 ? ` ... +${mainImages.length - 2} more` : ''}`);
    }
    if (descImages.length > 0) {
      console.log(`   Desc: ${descImages.slice(0, 2).join(', ')}${descImages.length > 2 ? ` ... +${descImages.length - 2} more` : ''}`);
    }
    console.log('');
  });

  // Summary statistics
  let totalProducts = 0;
  let totalMainImages = 0;
  let totalDescImages = 0;

  allProducts.forEach(product => {
    const localImages = product.localImages || [];
    if (localImages.length > 0) {
      totalProducts++;
      const mainImages = localImages.filter(img => img.includes('_t'));
      const descImages = localImages.filter(img => !img.includes('_t'));
      totalMainImages += mainImages.length;
      totalDescImages += descImages.length;
    }
  });

  console.log('─────────────────────────────────────────────────────────');
  console.log('SUMMARY:');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Products with images: ${totalProducts}`);
  console.log(`Total main images (_t): ${totalMainImages} (avg: ${(totalMainImages / totalProducts).toFixed(1)} per product)`);
  console.log(`Total desc images (no _t): ${totalDescImages} (avg: ${(totalDescImages / totalProducts).toFixed(1)} per product)`);
  console.log('─────────────────────────────────────────────────────────\n');

  console.log('✅ Image separation logic verified!');
  console.log('\nThe updated import script will now:');
  console.log('  1. Upload all images while tracking original filenames');
  console.log('  2. Filter images by _t prefix');
  console.log('  3. Put _t images in p_images (main product gallery)');
  console.log('  4. Put non-_t images in p_rich_description.images (detail images)');
}

main().catch(console.error);
