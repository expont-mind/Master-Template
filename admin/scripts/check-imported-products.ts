import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtpfavodqjyosdnxjwjq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NzI5MiwiZXhwIjoyMDgzNzczMjkyfQ.6WXPusCX0YHXC5PwEgXSk8OKabjDLJ0OP_qYU6MX44o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Checking imported products...\n');

  // Try different date formats
  const queries = [
    { label: 'No date filter', filter: null },
    { label: 'Date >= 2026-02-10', filter: '2026-02-10' },
    { label: 'Date >= 2026-02-10T00:00:00', filter: '2026-02-10T00:00:00' },
    { label: 'Date >= 2026-02-10T16:00:00', filter: '2026-02-10T16:00:00' },
  ];

  for (const q of queries) {
    let query = supabase
      .from('products')
      .select('id, name, created_at', { count: 'exact' })
      .not('original_url', 'is', null);

    if (q.filter) {
      query = query.gte('created_at', q.filter);
    }

    const { data, count, error } = await query.limit(5);

    if (error) {
      console.log(`${q.label}: ERROR - ${error.message}\n`);
    } else {
      console.log(`${q.label}: ${count} products`);
      if (data && data.length > 0) {
        console.log(`  First: ${data[0].name} (${data[0].created_at})`);
      }
      console.log('');
    }
  }
}

main().catch(console.error);
