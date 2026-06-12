# Product Import Fix - Image Separation Implementation

## Summary

Successfully implemented the fix to separate product images based on the `_t` prefix:

- **Main images** (with `_t` prefix) → `p_images` (main product gallery)
- **Description images** (without `_t` prefix) → `p_rich_description.images` (detail images)

## Changes Made

### 1. Updated Files

#### `/admin/scripts/import-products.ts`

- ✅ `uploadImagesChunk()` - Returns `Array<{ url: string; original: string }>` instead of `string[]`
- ✅ `uploadProductImages()` - Updated return type to match
- ✅ `saveProduct()` - Filters images by `_t` prefix and creates separate arrays
- ✅ `processProduct()` - Updated to use new parameter type

#### `/admin/scripts/import-products-test.ts`

- ✅ Applied identical changes as above
- ✅ Updated to test with products 151-153 (offset: 150)

### 2. Verification Scripts Created

#### `/admin/scripts/verify-image-separation.ts`

Demonstrates the fix logic works correctly:

```
Products with images: 156
Total main images (_t): 1,044 (avg: 6.7 per product)
Total desc images (no _t): 3,689 (avg: 23.6 per product)
```

**Current problem**: All ~30 images per product are in `p_images`
**After fix**: Only ~7 main images in `p_images`, ~24 description images in `p_rich_description.images`

#### `/admin/scripts/delete-test-products.ts`

Helper script to delete test products (only those without orders)

### 3. TypeScript Compilation

Both scripts compile successfully with no errors:

```bash
npx tsc --noEmit scripts/import-products.ts
npx tsc --noEmit scripts/import-products-test.ts
```

## Current Situation

All 156 products from the JSON file have been imported with the **old logic** (all images in `p_images`). These products:

- ❌ Have ALL images in the main product gallery
- ❌ Have NO images in "Зурган тайлбар" (rich description)
- ⚠️ Have associated orders, so cannot be deleted and re-imported

## Next Steps

### Option 1: Keep Existing Products (Recommended)

Since the products have orders, keep them as-is. The fix will apply to:

- Any future product imports
- Any new datasets added later

### Option 2: Migration Script (If Required)

If it's critical to fix the existing 156 products, create a migration script that:

1. For each product, fetch all `product_images`
2. Query the Supabase storage to get the original filename for each image URL
3. Separate images by whether filename contains `_t`
4. Update `products.rich_description` with non-`_t` images
5. Delete non-`_t` entries from `product_images`

**Risk**: This is complex because uploaded images have randomized filenames like `1707654321-abc123.jpg`, so the original `_t` pattern might not be preserved in the URL.

## How to Test the Fix

1. **Get new product data** (products not yet in database)
2. **Run test import**:
   ```bash
   npx tsx scripts/import-products-test.ts
   ```
3. **Verify in admin UI**:
   - Main product gallery should show only ~7 images (those with `_t` prefix)
   - "Дэлгэрэнгүй тайлбар" section should show ~24 images (rich description)

## Code Example

### Before (All images in p_images)

```typescript
const p_images = imageUrls.map((url, idx) => ({
  url,
  is_primary: idx === 0,
  sort_order: idx,
}));
const p_rich_description = null;
```

### After (Images separated by \_t prefix)

```typescript
// Separate images by type based on _t prefix
const mainImages = uploadedImages.filter((img) => img.original.includes("_t"));
const descImages = uploadedImages.filter((img) => !img.original.includes("_t"));

// Main product images (with _t prefix)
const p_images = mainImages.map((img, idx) => ({
  url: img.url,
  is_primary: idx === 0,
  sort_order: idx,
}));

// Rich description with images (without _t prefix)
const p_rich_description =
  descImages.length > 0 ? { content: "", images: descImages.map((img) => img.url) } : null;
```

## Verification Command

To verify the logic without importing:

```bash
npx tsx scripts/verify-image-separation.ts
```

This shows how images will be separated for all products in the JSON file.
