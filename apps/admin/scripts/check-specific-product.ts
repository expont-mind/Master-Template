import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qtpfavodqjyosdnxjwjq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const productId = "6b9022b0-966f-47bc-9d4b-b642db8ae944"; // Mise En Scene

  console.log("Checking product:", productId, "\n");

  // Check product_images
  const {
    data: images,
    error: imgError,
    count,
  } = await supabase
    .from("product_images")
    .select("*", { count: "exact" })
    .eq("product_id", productId)
    .order("sort_order");

  console.log("Product Images Query:");
  console.log("  Error:", imgError);
  console.log("  Count:", count);
  console.log("  Data length:", images?.length || 0);
  if (images && images.length > 0) {
    console.log("  First image:", images[0]);
  }
  console.log("");

  // Try with different query
  const { data: allImages } = await supabase
    .from("product_images")
    .select("id, product_id, url")
    .eq("product_id", productId);

  console.log("Simple query:");
  console.log("  Count:", allImages?.length || 0);
  console.log("");

  // Check all product_images for this date
  const { count: totalCount } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true });

  console.log("Total product_images in database:", totalCount);
}

main().catch(console.error);
