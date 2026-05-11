import { sendSkytelSms } from "./skytel";
import { sendCallproSms, type SmsResult } from "./callpro";

export type { SmsResult } from "./callpro";

// Provider switch: SMS_PROVIDER=callpro routes through CallPro, anything
// else (including unset) falls back to Skytel. Read at call time so a
// Vercel env-var change takes effect on the next cold start without a
// code redeploy.
export function activeSmsProvider(): "callpro" | "skytel" {
  return process.env.SMS_PROVIDER === "callpro" ? "callpro" : "skytel";
}

export async function sendSms(
  phone: string,
  message: string,
): Promise<SmsResult> {
  const provider = activeSmsProvider();
  const result =
    provider === "callpro"
      ? await sendCallproSms(phone, message)
      : await sendSkytelSms(phone, message);
  // Single line per send so silent failures are visible in Vercel logs.
  // On success: provider + messageId. On failure: provider + error + raw body.
  if (result.success) {
    console.log(
      `[sms] ${provider} ok phone=${phone} messageId=${result.messageId ?? "-"}`,
    );
  } else {
    console.error(
      `[sms] ${provider} fail phone=${phone} error=${result.error} raw=${result.rawResponse ?? "-"}`,
    );
  }
  return result;
}
