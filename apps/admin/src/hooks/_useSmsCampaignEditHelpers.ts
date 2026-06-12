import type { SmsCampaignFormData, RecipientFilter } from "@/components/sms-campaign/types";

export const defaultFilter: RecipientFilter = { type: "all" };

export const defaultFormData: SmsCampaignFormData = {
  name: "",
  message: "",
  recipient_filter: defaultFilter,
  scheduled_at: null,
};

/**
 * Returns the first validation error (Mongolian) for the SMS campaign form,
 * or null if the form is valid. Extracted from useSmsCampaignEdit to keep
 * the hook body under the max-lines budget.
 */
export function validateCampaignForm(
  formData: SmsCampaignFormData,
  status: "draft" | "scheduled" | "send",
): string | null {
  if (!formData.name.trim()) {
    return "Кампанийн нэрийг заавал оруулна уу.";
  }
  if (!formData.message.trim()) {
    return "Мессежийн текстийг заавал оруулна уу.";
  }
  if (status === "scheduled" && !formData.scheduled_at) {
    return "Төлөвлөсөн огноог заавал сонгоно уу.";
  }
  return null;
}

export function buildSavePayload(formData: SmsCampaignFormData, status: "draft" | "scheduled") {
  return {
    name: formData.name,
    message: formData.message,
    recipient_filter: formData.recipient_filter,
    scheduled_at: formData.scheduled_at,
    status,
    updated_at: new Date().toISOString(),
  };
}

export function buildSendPayload(formData: SmsCampaignFormData) {
  return {
    name: formData.name,
    message: formData.message,
    recipient_filter: formData.recipient_filter,
    status: "draft" as const,
    updated_at: new Date().toISOString(),
  };
}

interface SendErrorPayload {
  error?: string;
  sent_count?: number;
  failed_count?: number;
}

/**
 * Formats the user-facing error string for the `/api/admin/sms/send`
 * response. When some messages succeeded but others failed, includes the
 * counts; otherwise returns the raw error message.
 */
export function formatSendError(data: SendErrorPayload): string | null {
  if (!data.error) return null;
  if (data.failed_count) {
    return `${data.sent_count ?? 0} амжилттай, ${data.failed_count} амжилтгүй. Алдаа: ${data.error}`;
  }
  return data.error;
}
