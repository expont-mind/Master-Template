# Product Image Separation - Migration Guide

## Overview

This guide covers migrating 151 existing products to separate main images (with `_t` prefix) from description images (without `_t` prefix).

**Current Problem:**

- All ~4,670 images are in `product_images` (main gallery)
- No images in rich description section

**After Migration:**

- ~1,020 main images in `product_images` (avg 7 per product)
- ~3,650 description images in `product_rich_descriptions` (avg 24 per product)

## Prerequisites

✅ Updated import scripts are in place (`import-products.ts`, `import-products-test.ts`)
✅ Migration script created (`migrate-existing-products.ts`)
✅ Rollback script created (`rollback-migration.ts`)
✅ Backup script created (`backup-before-migration.ts`)

## Safety Measures

### 1. Dry Run (Preview Changes)

Run this first to see what will happen:

```bash
npx tsx scripts/migrate-existing-products-dryrun.ts
```

**Output:** Shows exactly how many images will move for each product.

### 2. Create Backup

**IMPORTANT:** Always create a backup before migration:

```bash
npx tsx scripts/backup-before-migration.ts
```

**Output:** Creates `migration-backup.json` with complete state of all 151 products.

## Migration Process

### Step 1: Review Dry Run

```bash
npx tsx scripts/migrate-existing-products-dryrun.ts
```

Review the output carefully:

- Check sample product changes
- Verify total image counts make sense
- Confirm 151 products will be migrated

### Step 2: Create Backup

```bash
npx tsx scripts/backup-before-migration.ts
```

Verify:

- ✅ Backup file created at `scripts/migration-backup.json`
- ✅ File size is reasonable (~2-5 MB)
- ✅ Contains all products, images, and rich descriptions

### Step 3: Run Migration

```bash
npx tsx scripts/migrate-existing-products.ts
```

**What happens:**

1. Fetches all 151 imported products from database
2. Matches them with JSON data by `original_url`
3. For each product:
   - Gets current `product_images` (ordered by `sort_order`)
   - Matches them with original JSON `localImages` by position
   - Separates into main (\_t) and description (no \_t) images
   - Deletes description images from `product_images`
   - Updates remaining main images' sort_order
   - Creates/updates `product_rich_descriptions` with description images

**Duration:** ~3-5 minutes for 151 products

**Monitor output:**

- ✓ marks = successful migration
- ✗ marks = failed (check error message)
- Progress updates every 25 products

### Step 4: Verify Migration

After migration completes:

#### A. Check Database Counts

```bash
npx tsx scripts/check-products.ts
```

Expected:

- Total products: 3749 (unchanged)
- Products with rich_description images: 151

#### B. Visual Verification in Admin UI

1. Open admin panel: http://localhost:3002/products
2. Open a few migrated products (created on 2026-02-10)
3. Verify:
   - ✅ Main gallery shows ~7 images (with `_t` prefix)
   - ✅ "Дэлгэрэнгүй тайлбар" section shows ~24 images
   - ✅ Images look correct and not broken

#### C. Sample Products to Check

```
1. Mise En Scene Curling Essence 2X - Should have 16 main, 22 desc
2. Fully Rice Cera Sunscreen - Should have 6 main, 48 desc
3. Starlike Foundation Sunscreen - Should have 10 main, 41 desc
```

## Rollback (If Needed)

If something goes wrong or you want to undo the migration:

```bash
npx tsx scripts/rollback-migration.ts
```

**What happens:**

1. Finds all products with rich_description images
2. Moves those images back to `product_images`
3. Clears images from `product_rich_descriptions`
4. Products return to pre-migration state

**Duration:** ~2-3 minutes

## Troubleshooting

### Migration Failed Partway

**Symptom:** Some products migrated, some didn't

**Solution:**

1. Check error messages in output
2. Fix the issue (usually data inconsistency)
3. Re-run migration - it's safe to run multiple times
4. Already-migrated products will be skipped or updated

### Images Not Showing After Migration

**Symptom:** Images show as broken in admin UI

**Possible causes:**

- Image URLs are invalid
- Storage permissions issue
- Browser cache

**Solution:**

1. Check browser console for 404 errors
2. Clear browser cache
3. Verify images exist in Supabase storage
4. If persistent, run rollback and investigate

### Wrong Images in Wrong Section

**Symptom:** Main images have description photos or vice versa

**Possible cause:**

- JSON file doesn't match database order
- Products were modified after import

**Solution:**

1. Run rollback
2. Check if product was manually edited after import
3. May need manual fix for that specific product

## Post-Migration

### Future Imports

All future product imports will automatically use the new logic:

```bash
npx tsx scripts/import-products-test.ts  # Test with 3 products
npx tsx scripts/import-products.ts       # Full import
```

Images will be correctly separated from the start.

### Manual Product Creation

When creating products manually in admin UI:

- Main images → Upload to main gallery
- Description images → Upload to "Зурган тайлбар" section

## Files Reference

```
scripts/
├── import-products.ts                    # Fixed import (future imports)
├── import-products-test.ts              # Test import (future imports)
├── migrate-existing-products.ts          # Migrate 151 existing products
├── migrate-existing-products-dryrun.ts   # Preview migration
├── backup-before-migration.ts            # Create backup
├── rollback-migration.ts                 # Undo migration
├── verify-image-separation.ts            # Verify logic
├── delete-test-products.ts              # Helper
├── check-products.ts                     # Check database
├── check-schema.ts                       # Check table structure
└── MIGRATION_GUIDE.md                    # This file
```

## Migration Checklist

Use this checklist when performing the migration:

- [ ] Read this entire guide
- [ ] Run dry-run to preview changes
- [ ] Review dry-run output (check sample products)
- [ ] Create backup (`backup-before-migration.ts`)
- [ ] Verify backup file exists and has content
- [ ] Run migration (`migrate-existing-products.ts`)
- [ ] Monitor migration output for errors
- [ ] Wait for completion (3-5 minutes)
- [ ] Check final summary (success count, failed count)
- [ ] Verify a few products in admin UI
- [ ] Check main gallery has ~7 images
- [ ] Check description section has ~24 images
- [ ] Test image loading (no broken images)
- [ ] If issues found, run rollback
- [ ] Document any issues or anomalies

## Success Criteria

Migration is successful when:

✅ Migration script completes with 0 failures
✅ Total image count in database unchanged (~4,670)
✅ Main gallery per product reduced from ~30 to ~7 images
✅ Rich description has ~24 images per product
✅ All images load correctly in admin UI
✅ No broken image links
✅ Product display looks correct

## Questions?

If you encounter any issues not covered in this guide:

1. Check the error message in the script output
2. Review the backup file to understand current state
3. Consider running rollback to restore original state
4. Debug the specific issue
5. Re-run migration after fixing

---

**Last Updated:** 2026-02-11
**Migration Version:** 1.0
**Products Affected:** 151 (imported 2026-02-10)
