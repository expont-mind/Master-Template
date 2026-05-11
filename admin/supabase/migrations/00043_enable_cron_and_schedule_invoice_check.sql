-- Enable pg_cron and pg_net extensions for server-side invoice checking
-- The check-pending-invoices edge function is invoked manually, not on a cron schedule.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
