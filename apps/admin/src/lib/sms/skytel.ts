import { LOCALE } from "@/lib/utils/brand-config";

import type { SmsResult } from "./callpro";

export function normalizeMongolianPhone(phone: string): string {
  return phone.replace(LOCALE.phoneRegex, "").replace(/\D/g, "");
}

/**
 * Skytel returns negative numbers for known error codes ("-1", "-2", ...).
 * Plain integer >= 0 (or non-numeric text) means a successful queue accept.
 */
function checkNumericErrorCode(text: string): SmsResult | null {
  const num = Number(text);
  if (!isNaN(num) && num < 0) {
    return {
      success: false,
      error: `Skytel error code: ${text}`,
      rawResponse: text,
    };
  }
  return null;
}

/**
 * Skytel's failure shape observed in the wild:
 *   {"status":0,"sent_count":0,"message":"..."}
 * Anything that yells "0 sent" or non-1 status is a failure even
 * when the HTTP response is 200. Non-JSON bodies are treated as OK.
 */
function checkJsonFailureBody(text: string): SmsResult | null {
  try {
    const json = JSON.parse(text);
    const isSkytelFailure =
      json.status === 0 ||
      json.status === "0" ||
      json.sent_count === 0 ||
      json.error ||
      json.status === "error" ||
      json.result === "error";
    if (!isSkytelFailure) return null;
    const msg = typeof json.message === "string" && json.message.length > 0 ? json.message : text;
    return { success: false, error: `Skytel API: ${msg}`, rawResponse: text };
  } catch {
    return null;
  }
}

function classifySkytelResponse(res: Response, text: string): SmsResult {
  if (!res.ok) {
    return {
      success: false,
      error: `HTTP ${res.status}: ${text}`,
      rawResponse: text,
    };
  }
  if (text) {
    const numericError = checkNumericErrorCode(text);
    if (numericError) return numericError;
    const jsonError = checkJsonFailureBody(text);
    if (jsonError) return jsonError;
  }
  return { success: true, rawResponse: text };
}

export async function sendSkytelSms(phone: string, message: string): Promise<SmsResult> {
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
    return classifySkytelResponse(res, text);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
