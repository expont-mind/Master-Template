import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Provider switch: SMS_PROVIDER=callpro routes through CallPro, anything
// else (including unset) falls back to Skytel for safe rollback. Read at
// call time so a Supabase secret change takes effect on the next cold
// start without a function redeploy.
function activeSmsProvider(): "callpro" | "skytel" {
  return Deno.env.get("SMS_PROVIDER") === "callpro" ? "callpro" : "skytel";
}

type SmsResult = {
  success: boolean;
  error?: string;
  /** CallPro message_id (UUID) on success — useful for delivery tracking. */
  messageId?: string;
  /** Raw response body for debugging silent failures. */
  rawResponse?: string;
};

async function sendSkytelSms(phone: string, message: string): Promise<SmsResult> {
  const apiUrl = Deno.env.get("SKYTEL_API_URL");
  const apiToken = Deno.env.get("SKYTEL_API_TOKEN");
  if (!apiUrl || !apiToken) {
    return { success: false, error: "SKYTEL_API_URL / SKYTEL_API_TOKEN not configured" };
  }
  const url = `${apiUrl}?token=${apiToken}&sendto=${phone}&message=${encodeURIComponent(message)}`;
  const res = await fetch(url);
  const text = (await res.text()).trim();
  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}: ${text}`, rawResponse: text };
  }
  return { success: true, rawResponse: text };
}

async function sendCallproSms(phone: string, message: string): Promise<SmsResult> {
  const apiUrl = Deno.env.get("CALLPRO_API_URL");
  const apiKey = Deno.env.get("CALLPRO_API_KEY");
  const fromNumber = Deno.env.get("CALLPRO_FROM_NUMBER");
  if (!apiUrl || !apiKey || !fromNumber) {
    return {
      success: false,
      error: "CALLPRO_API_URL / CALLPRO_API_KEY / CALLPRO_FROM_NUMBER not configured",
    };
  }
  const res = await fetch(`${apiUrl}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ from: fromNumber, to: phone, text: message }),
  });
  const text = (await res.text()).trim();
  if (!res.ok) {
    return { success: false, error: mapCallproError(res.status, text, phone), rawResponse: text };
  }
  try {
    const json = JSON.parse(text) as { status?: string; message_id?: string };
    if (json.status === "queued" && json.message_id) {
      return { success: true, messageId: json.message_id, rawResponse: text };
    }
    return {
      success: false,
      error: `CallPro: Unexpected 200 shape — ${text}`,
      rawResponse: text,
    };
  } catch {
    return {
      success: false,
      error: `CallPro: Non-JSON 200 response — ${text}`,
      rawResponse: text,
    };
  }
}

function mapCallproError(status: number, body: string, phone: string): string {
  let json: { error?: string; issues?: { message?: string }[] } = {};
  try {
    json = JSON.parse(body);
  } catch {
    // body may be plain text
  }
  switch (status) {
    case 400: return `CallPro: Bad request — ${json.error ?? body}`;
    case 401: return `CallPro: Unauthorized — check CALLPRO_API_KEY`;
    case 402: return `CallPro: Payment required — account balance overdue`;
    case 403: return `CallPro: Blocked number — ${phone}`;
    case 404: return `CallPro: Tenant or sender number not found — check CALLPRO_FROM_NUMBER`;
    case 422: return `CallPro: Validation — ${json.issues?.[0]?.message ?? body}`;
    case 500: return `CallPro: Server error — ${json.error ?? body}`;
    default: return `CallPro: HTTP ${status} — ${body}`;
  }
}

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

    // Strip +976 or 976 prefix to get 8-digit format (works for both providers)
    const phone = user.phone.replace(/^\+?976/, "");
    const message = `Monpang kod: ${sms.otp}`;
    const provider = activeSmsProvider();

    const result = provider === "callpro"
      ? await sendCallproSms(phone, message)
      : await sendSkytelSms(phone, message);

    // Single line per send so silent failures are visible in function logs.
    if (result.success) {
      console.log(`[send-sms] ${provider} ok phone=${phone} messageId=${result.messageId ?? "-"}`);
    } else {
      console.error(`[send-sms] ${provider} fail phone=${phone} error=${result.error} raw=${result.rawResponse ?? "-"}`);
    }

    // Log to sms_logs (fire-and-forget). Use the real message_id from
    // CallPro when available; fall back to the raw response body for
    // Skytel debugging since it has no real provider ID.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    supabase
      .from("sms_logs")
      .insert({
        phone,
        message,
        status: result.success ? "sent" : "failed",
        provider,
        provider_message_id:
          result.messageId ?? result.rawResponse?.slice(0, 255) ?? null,
        error_message: result.error ?? null,
        user_id: null,
        sent_at: result.success ? new Date().toISOString() : null,
      })
      .then(() => {});

    // Preserve original behavior — return 200 even on send failure so Supabase
    // Auth doesn't retry indefinitely. The failure is visible in sms_logs and
    // function logs; the user's OTP attempt will time out naturally.
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
