import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qtpfavodqjyosdnxjwjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o'
);

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('name, slug, created_at')
    .or('slug.like.%stridex%,slug.like.%chasing%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found products with similar slugs:');
  console.log(data);
}

main();
