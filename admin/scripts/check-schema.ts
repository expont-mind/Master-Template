import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtpfavodqjyosdnxjwjq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Fetching a sample product to see available columns...\n');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Available columns:');
  console.log(Object.keys(data).sort().join(', '));
  console.log('\n');

  // Check if there's a description-related field
  const descFields = Object.keys(data).filter(k =>
    k.toLowerCase().includes('desc') || k.toLowerCase().includes('rich')
  );

  if (descFields.length > 0) {
    console.log('Description-related fields:');
    descFields.forEach(field => {
      console.log(`  - ${field}: ${typeof data[field]}`);
      if (data[field]) {
        console.log(`    Value: ${JSON.stringify(data[field]).substring(0, 100)}...`);
      }
    });
  }
}

main().catch(console.error);
