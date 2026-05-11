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
  return phone.replace(/^\+?976/, "").replace(/\D/g, "");
}

export async function sendCallproSms(
  phone: string,
  message: string,
): Promise<SmsResult> {
  const apiUrl = process.env.CALLPRO_API_URL;
  const apiKey = process.env.CALLPRO_API_KEY;
  const fromNumber = process.env.CALLPRO_FROM_NUMBER;

  if (!apiUrl || !apiKey || !fromNumber) {
    return {
      success: false,
      error:
        "CALLPRO_API_URL / CALLPRO_API_KEY / CALLPRO_FROM_NUMBER not configured",
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

function mapCallproError(
  status: number,
  body: string,
  phone: string,
): string {
  let json: { error?: string; issues?: { message?: string }[] } = {};
  try {
    json = JSON.parse(body);
  } catch {
    // body may be plain text
  }
  switch (status) {
    case 400:
      return `CallPro: Bad request — ${json.error ?? body}`;
    case 401:
      return `CallPro: Unauthorized — check CALLPRO_API_KEY`;
    case 402:
      return `CallPro: Payment required — account balance overdue`;
    case 403:
      return `CallPro: Blocked number — ${phone}`;
    case 404:
      return `CallPro: Tenant or sender number not found — check CALLPRO_FROM_NUMBER`;
    case 422:
      return `CallPro: Validation — ${json.issues?.[0]?.message ?? body}`;
    case 500:
      return `CallPro: Server error — ${json.error ?? body}`;
    default:
      return `CallPro: HTTP ${status} — ${body}`;
  }
}
