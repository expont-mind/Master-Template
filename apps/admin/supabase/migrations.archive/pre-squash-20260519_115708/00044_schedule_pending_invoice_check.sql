-- Schedule pg_cron job to check pending payment invoices every 5 minutes.
-- This is the critical safety net for QPay payments (no webhook/callback),
-- catching payments where the user closed the browser before polling detected it.
--
-- Prerequisites (from migration 00043):
--   - pg_cron extension enabled
--   - pg_net extension enabled
--
-- The check-pending-invoices edge function (already deployed) handles:
--   - Fetching pending invoices (5 min – 2 hrs old)
--   - Verifying QPay and LendMN payment status
--   - Updating DB + creating orders for paid invoices
--   - Expiring invoices older than 2 hours

-- Store project URL in Vault for use by pg_cron (avoids hardcoding)
SELECT vault.create_secret(
  'https://qtpfavodqjyosdnxjwjq.supabase.co',
  'project_url'
);

-- Schedule: every 5 minutes, invoke the check-pending-invoices edge function
-- The function has verify_jwt=false, so no Authorization header is needed.
SELECT cron.schedule(
  'check-pending-invoices',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/check-pending-invoices',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
