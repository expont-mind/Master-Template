import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtpfavodqjyosdnxjwjq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Checking products in database...\n');

  // Get total count
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error:', countError.message);
    return;
  }

  console.log(`Total products: ${count}\n`);

  // Get recent products
  const { data: recentProducts, error } = await supabase
    .from('products')
    .select('id, name, created_at, original_url')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Most recent 10 products:');
  recentProducts?.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name}`);
    console.log(`   Created: ${p.created_at}`);
    console.log(`   URL: ${p.original_url}\n`);
  });

  // Check for products with original_url set
  const { count: withUrlCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('original_url', 'is', null);

  console.log(`Products with original_url: ${withUrlCount}`);
}

main().catch(console.error);
