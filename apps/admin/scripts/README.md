# Product Import Scripts

## import-products.ts

Bulk import script for uploading products from scraped JSON data to the Monpang admin system.

### Features

- ✅ Checks for existing products by original_url (skip duplicates)
- ✅ Uploads local product images to Supabase storage
- ✅ Batch processing (10 products at a time)
- ✅ Parallel image uploads (5 concurrent per product)
- ✅ Progress tracking with real-time console updates
- ✅ Comprehensive error handling and reporting
- ✅ Final statistics summary

### Prerequisites

1. **Data files** must be available:
   - `/Users/dashka/Downloads/NewProduct (1)/new_products.json` - Product data
   - `/Users/dashka/Downloads/NewProduct (1)/newimages/` - Product images

2. **Supabase credentials** must be configured in `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Node.js 18+** required (for native fetch and FormData support)

### Usage

```bash
# Navigate to admin directory
cd /Users/dashka/mine/code/monpang-web/admin

# Run the import script
npx tsx scripts/import-products.ts
```

### Configuration

Edit these constants in `import-products.ts` if needed:

```typescript
const DATA_FILE = "/Users/dashka/Downloads/NewProduct (1)/new_products.json";
const IMAGES_DIR = "/Users/dashka/Downloads/NewProduct (1)/";
const BATCH_SIZE = 10; // Products per batch
const MAX_CONCURRENT_UPLOADS = 5; // Images uploaded at once
```

### Import Behavior

**Product status**: All products imported as `draft` (allows review before publishing)

**Duplicate handling**: Products with existing `original_url` are skipped

**Image handling**:

- Max 5 images uploaded concurrently per product
- Uploaded to Supabase storage bucket: `images`
- Original CDN URLs are NOT used (local files uploaded instead)

**Data mapping**:

```typescript
{
  name: json.title,
  slug: auto-generated from title,
  description: json.description,
  price: json.price,
  discount_price: null,
  status: "draft",
  brand_id: null,
  original_url: json.url,

  // Empty arrays (to be filled manually later)
  p_category_ids: [],
  p_details: [],
  p_rich_description: null,
  p_option_groups: null,
  p_variants: []
}
```

### Expected Output

```
╔════════════════════════════════════════════════════════════════╗
║         Monpang Product Import - NewProduct (1) Dataset       ║
╚════════════════════════════════════════════════════════════════╝

Loading products from JSON...
Loaded 156 products

Checking for duplicates...
Found 23 existing products
New products to import: 133

Processing batch 1/14 (10 products)...
  ✓ Uploaded: Stridex Mild Foam Cleanser (10 images)
  ✓ Uploaded: COSRX Snail Mucin (8 images)
  ...
Progress: 10/133 (7.5%) - 10 successful

Processing batch 2/14...
  ...

╔════════════════════════════════════════════════════════════════╗
║                        Import Complete!                        ║
╚════════════════════════════════════════════════════════════════╝

Summary:
─────────────────────────────────
Total in file:       156
Already existed:     23
Attempted:           133
Successful:          130
Failed:              3
─────────────────────────────────
Time elapsed: 12m 34s

Failed products:
  - "Product Name X" (https://...)
    Error: Image upload timeout
  - "Product Name Y" (https://...)
    Error: Invalid price format

To view imported products, go to:
http://localhost:3002/products?date_from=2026-02-10
```

### Performance

**Estimated time for 156 products**:

- ~10 images per product × 1,560 images / 5 concurrent = ~520 upload batches
- ~2 seconds per upload batch = ~17 minutes for images
- ~0.5 seconds per product × 156 products = ~1.5 minutes for RPC calls
- **Total: ~18-20 minutes**

### Post-Import Tasks

After the script completes:

1. **Review imported products**:
   - Go to: http://localhost:3002/products?status=draft
   - Filter by status = "draft"
   - Check random products for data accuracy

2. **Assign categories**:
   - Bulk-select products
   - Assign to appropriate categories
   - Save changes

3. **Assign brands** (if needed):
   - Currently all brands are null
   - Edit products individually or bulk-assign

4. **Activate products**:
   - After review, bulk-update status from "draft" to "active"
   - Products will then appear on the storefront

5. **Handle failures** (if any):
   - Review failed products from the report
   - Manually upload if needed
   - Check error messages for root cause

### Verification Queries

Run these SQL queries in Supabase to verify the import:

```sql
-- Count products imported today
SELECT COUNT(*)
FROM products
WHERE DATE(created_at) = CURRENT_DATE;

-- Find products without images
SELECT p.id, p.name, COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE DATE(p.created_at) = CURRENT_DATE
GROUP BY p.id, p.name
HAVING COUNT(pi.id) = 0;

-- Check for duplicate original_url
SELECT original_url, COUNT(*)
FROM products
WHERE original_url IS NOT NULL
GROUP BY original_url
HAVING COUNT(*) > 1;

-- View today's imports
SELECT id, name, price, status, created_at
FROM products
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Error Handling

The script handles errors gracefully:

- **Image upload fails**: Logs error, continues with remaining images
- **All images fail**: Skips product, logs error, continues to next product
- **RPC call fails**: Logs error, continues to next product
- **Batch fails**: Logs batch error, continues to next batch

### Troubleshooting

**"No files provided" error**:

- Check that image files exist in the `newimages/` directory
- Verify `localImages` paths in JSON are correct

**"Upload failed" error**:

- Check Supabase storage bucket permissions
- Verify service role key has storage access
- Check storage quota limits

**"RPC call failed" error**:

- Verify `save_product` function exists in database
- Check function permissions (should be SECURITY DEFINER)
- Verify all required fields are present

**"All duplicates" message**:

- All products already exist in database
- Check `original_url` field values
- To re-import, delete existing products first

### Future Enhancements

Potential improvements:

1. **Resume capability**: Save progress to JSON file, skip already-processed products on restart
2. **Retry logic**: Retry failed uploads with exponential backoff
3. **Metadata tracking**: Add custom metadata field for import session tracking
4. **Dry run mode**: Preview what would be imported without actually uploading
5. **Progress file**: Write results to JSON for later review
6. **Category auto-assignment**: Use AI/ML to suggest categories based on product description
