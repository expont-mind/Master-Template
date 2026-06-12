import { log } from "@/lib/observability/log";

import { sendCallproSms, type SmsResult } from "./callpro";
import { sendSkytelSms } from "./skytel";

export type { SmsResult } from "./callpro";

// Provider switch: SMS_PROVIDER=callpro routes through CallPro, anything
// else (including unset) falls back to Skytel. Read at call time so a
// Vercel env-var change takes effect on the next cold start without a
// code redeploy.
export function activeSmsProvider(): "callpro" | "skytel" {
  return process.env.SMS_PROVIDER === "callpro" ? "callpro" : "skytel";
}

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const provider = activeSmsProvider();
  const result =
    provider === "callpro"
      ? await sendCallproSms(phone, message)
      : await sendSkytelSms(phone, message);
  // Single line per send so silent failures are visible in Vercel logs.
  // On success: provider + messageId. On failure: provider + error + raw body.
  if (result.success) {
    log.info("sms_send_ok", {
      provider,
      phone,
      messageId: result.messageId ?? null,
    });
  } else {
    log.error("sms_send_failed", {
      provider,
      phone,
      error: result.error,
      raw: result.rawResponse ?? null,
    });
  }
  return result;
}
