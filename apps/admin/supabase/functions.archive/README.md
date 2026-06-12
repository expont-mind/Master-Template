# Archived Edge Functions

These edge functions are kept in git history but **not deployed**. Each
duplicates logic that lives in the Next.js frontend (either as a Server
Action or an API route). The template standardizes on Next.js routes
because they are co-located with the cart/checkout UI and easier to debug.

If you genuinely need one of these (e.g. an old client's webhook is still
pointed at the Supabase Functions URL and you can't change it), restore via:

```bash
git mv apps/admin/supabase/functions.archive/<name> apps/admin/supabase/functions/<name>
```

## What was archived (2026-05-13)

| Function                  | Replaced by                                                                       | Notes                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `check-payment-status`    | `apps/frontend/src/components/checkout/actions/payment-status.ts` (Server Action) | The Server Action is invoked from `usePaymentPolling.ts` every 5s during the checkout modal.                               |
| `create-checkout-invoice` | `apps/frontend/src/components/checkout/actions/invoice.ts` (Server Action)        | The Server Action wraps QPay/LendMN/StorePay invoice creation.                                                             |
| `qpay-callback`           | `apps/frontend/src/app/api/checkout/callback/route.ts`                            | QPay webhook handler. Make sure QPay merchant dashboard points at the Next.js URL: `https://<site>/api/checkout/callback`. |
| `lendmn-callback`         | `apps/frontend/src/app/api/checkout/lendmn-callback/route.ts`                     | LendMN webhook handler. Confirm LendMN dashboard URL.                                                                      |
| `lendmn-debit`            | Direct LendMN API call from `apps/frontend/src/lib/lendmn/client.ts`              | Server-side TypeScript module, runs on Vercel's serverless.                                                                |
| `storepay-debit`          | Direct StorePay API call from `apps/frontend/src/lib/storepay/client.ts`          | Server-side TypeScript module.                                                                                             |
| `send-sms`                | _none — was not in use_                                                           | If you need SMS for OTP / order confirmations, build a Server Action that calls Skytel or Callpro directly.                |

## What stayed in `functions/`

| Function                 | Why it's still an edge function                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-pending-invoices` | Invoked by Supabase's pg_cron every 5 minutes (see migration `00044_schedule_pending_invoice_check.sql`). Cron can't call Next.js routes — needs an edge function URL.                       |
| `send-push-notification` | Invoked by DB triggers on order/notification inserts (see migrations `20260317100000_*` and `20260327100000_*`). Triggers call HTTPS endpoints; using an edge function keeps the URL stable. |
| `_shared/`               | Shared utilities (logger) imported by the two active functions.                                                                                                                              |

## Future: when should the archive be deleted?

After the first client has been live for **3 months** with no fallback to
the archived functions, you can safely `rm -rf functions.archive/`. The
git history still preserves them. Until then, keep them around as a safety
net for clients with old webhook configurations.
