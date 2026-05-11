// ────────────────────────────────────────────────────────────────────
// Snapshot of the send-sms Edge Function as it was deployed BEFORE the
// CallPro migration. Kept for rollback/audit purposes only — not the
// active source. The active version is index.ts.
// ────────────────────────────────────────────────────────────────────
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SKYTEL_API_URL = Deno.env.get("SKYTEL_API_URL")!;
const SKYTEL_API_TOKEN = Deno.env.get("SKYTEL_API_TOKEN")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Read body as text for signature verification
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature
    const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET")!;
    const wh = new Webhook(hookSecret.replace("v1,whsec_", ""));
    const { user, sms } = wh.verify(payload, headers) as {
      user: { phone: string };
      sms: { otp: string };
    };

    // Strip +976 or 976 prefix to get 8-digit Skytel format
    const phone = user.phone.replace(/^\+?976/, "");
    const message = `Monpang kod: ${sms.otp}`;

    // Send via Skytel API
    const url = `${SKYTEL_API_URL}?token=${SKYTEL_API_TOKEN}&sendto=${phone}&message=${encodeURIComponent(message)}`;
    const skytelRes = await fetch(url);
    const skytelText = await skytelRes.text();

    // Log to sms_logs (fire-and-forget)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    supabase
      .from("sms_logs")
      .insert({
        phone,
        message,
        status: skytelRes.ok ? "sent" : "failed",
        provider: "skytel",
        provider_message_id: skytelText || null,
        error_message: skytelRes.ok ? null : `HTTP ${skytelRes.status}: ${skytelText}`,
        user_id: null,
        sent_at: new Date().toISOString(),
      })
      .then(() => {});

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-sms error:", error);
    return new Response(
      JSON.stringify({ error: { message: (error as Error).message } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
