import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const SUPABASE_URL = "https://qtpfavodqjyosdnxjwjq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Deleting test products created from 2026-02-10 onwards (without orders)...\n");

  // Get products with their order count
  const { data: products, error: selectError } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      created_at,
      order_items (count)
    `,
    )
    .gte("created_at", "2026-02-10")
    .order("created_at", { ascending: false });

  if (selectError) {
    console.error("Error fetching products:", selectError.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("No test products found to delete.");
    return;
  }

  // Filter products that have no orders
  const deletableProducts = products.filter((p) => {
    const orderCount = Array.isArray(p.order_items) ? p.order_items.length : 0;
    return orderCount === 0;
  });

  const productsWithOrders = products.filter((p) => {
    const orderCount = Array.isArray(p.order_items) ? p.order_items.length : 0;
    return orderCount > 0;
  });

  console.log(`Found ${products.length} test products:`);
  console.log(`  - ${deletableProducts.length} can be deleted (no orders)`);
  console.log(`  - ${productsWithOrders.length} have orders (will skip)\n`);

  if (productsWithOrders.length > 0) {
    console.log("Products with orders (will NOT be deleted):");
    productsWithOrders.forEach((p, idx) => {
      const orderCount = Array.isArray(p.order_items) ? p.order_items.length : 0;
      console.log(`  ${idx + 1}. ${p.name} (${orderCount} orders)`);
    });
    console.log("");
  }

  if (deletableProducts.length === 0) {
    console.log("No deletable products found (all have orders).");
    return;
  }

  console.log(`Deleting ${deletableProducts.length} products without orders:\n`);
  deletableProducts.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.name}`);
  });

  // Delete products one by one
  let successCount = 0;
  let errorCount = 0;

  for (const product of deletableProducts) {
    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (error) {
      console.error(`  ✗ Failed to delete "${product.name}": ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`\n✅ Successfully deleted ${successCount} products!`);
  if (errorCount > 0) {
    console.log(`❌ Failed to delete ${errorCount} products`);
  }
}

main().catch(console.error);
