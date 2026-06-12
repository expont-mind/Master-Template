import { LOCALE } from "@/lib/utils/brand-config";

export type SmsResult = {
  success: boolean;
  error?: string;
  /** CallPro message_id (UUID) returned on a successful send. Use this to
   *  query delivery status via GET /:unique_id later. */
  messageId?: string;
  /** Raw body returned by CallPro — useful for debugging silent failures. */
  rawResponse?: string;
};

export function normalizeMongolianPhone(phone: string): string {
  return phone.replace(LOCALE.phoneRegex, "").replace(/\D/g, "");
}

export async function sendCallproSms(phone: string, message: string): Promise<SmsResult> {
  const apiUrl = process.env.CALLPRO_API_URL;
  const apiKey = process.env.CALLPRO_API_KEY;
  const fromNumber = process.env.CALLPRO_FROM_NUMBER;

  if (!apiUrl || !apiKey || !fromNumber) {
    return {
      success: false,
      error: "CALLPRO_API_URL / CALLPRO_API_KEY / CALLPRO_FROM_NUMBER not configured",
    };
  }

  const normalizedPhone = normalizeMongolianPhone(phone);

  try {
    const res = await fetch(`${apiUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        from: fromNumber,
        to: normalizedPhone,
        text: message,
      }),
    });
    const text = (await res.text()).trim();

    if (!res.ok) {
      return {
        success: false,
        error: mapCallproError(res.status, text, normalizedPhone),
        rawResponse: text,
      };
    }

    try {
      const json = JSON.parse(text) as {
        status?: string;
        message_id?: string;
      };
      if (json.status === "queued" && json.message_id) {
        return {
          success: true,
          messageId: json.message_id,
          rawResponse: text,
        };
      }
      // 200 with an unexpected shape — treat as failure for safety.
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
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown network error",
    };
  }
}

type CallproErrorBody = {
  error?: string;
  issues?: { message?: string }[];
};

const CALLPRO_ERROR_MESSAGES: Record<
  number,
  (json: CallproErrorBody, body: string, phone: string) => string
> = {
  400: (json, body) => `CallPro: Bad request — ${json.error ?? body}`,
  401: () => `CallPro: Unauthorized — check CALLPRO_API_KEY`,
  402: () => `CallPro: Payment required — account balance overdue`,
  403: (_json, _body, phone) => `CallPro: Blocked number — ${phone}`,
  404: () => `CallPro: Tenant or sender number not found — check CALLPRO_FROM_NUMBER`,
  422: (json, body) => `CallPro: Validation — ${json.issues?.[0]?.message ?? body}`,
  500: (json, body) => `CallPro: Server error — ${json.error ?? body}`,
};

function mapCallproError(status: number, body: string, phone: string): string {
  let json: CallproErrorBody = {};
  try {
    json = JSON.parse(body);
  } catch {
    // body may be plain text
  }
  const builder = CALLPRO_ERROR_MESSAGES[status];
  if (builder) return builder(json, body, phone);
  return `CallPro: HTTP ${status} — ${body}`;
}
