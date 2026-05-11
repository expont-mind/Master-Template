import type { SmsResult } from "./callpro";
import { LOCALE } from "@/lib/utils/brand-config";

export function normalizeMongolianPhone(phone: string): string {
  return phone.replace(LOCALE.phoneRegex, "").replace(/\D/g, "");
}

export async function sendSkytelSms(
  phone: string,
  message: string,
): Promise<SmsResult> {
  const apiUrl = process.env.SKYTEL_API_URL;
  const apiToken = process.env.SKYTEL_API_TOKEN;

  if (!apiUrl || !apiToken) {
    return {
      success: false,
      error: "SKYTEL_API_URL or SKYTEL_API_TOKEN not configured",
    };
  }

  try {
    const normalizedPhone = normalizeMongolianPhone(phone);
    const url = `${apiUrl}?token=${apiToken}&sendto=${normalizedPhone}&message=${encodeURIComponent(message)}`;
    const res = await fetch(url);
    const text = (await res.text()).trim();

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${text}`,
        rawResponse: text,
      };
    }

    if (text) {
      const num = Number(text);
      if (!isNaN(num) && num < 0) {
        return {
          success: false,
          error: `Skytel error code: ${text}`,
          rawResponse: text,
        };
      }
      try {
        const json = JSON.parse(text);
        // Skytel's failure shape observed in the wild:
        //   {"status":0,"sent_count":0,"message":"..."}
        // Anything that yells "0 sent" or non-1 status is a failure even
        // when the HTTP response is 200.
        const isSkytelFailure =
          json.status === 0 ||
          json.status === "0" ||
          json.sent_count === 0 ||
          json.error ||
          json.status === "error" ||
          json.result === "error";
        if (isSkytelFailure) {
          const msg =
            typeof json.message === "string" && json.message.length > 0
              ? json.message
              : text;
          return {
            success: false,
            error: `Skytel API: ${msg}`,
            rawResponse: text,
          };
        }
      } catch {
        // Not JSON — treat non-negative plain text as OK
      }
    }

    return { success: true, rawResponse: text };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
