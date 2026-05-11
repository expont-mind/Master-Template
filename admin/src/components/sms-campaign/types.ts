export type SmsCampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export interface RecipientFilter {
  type: "all" | "filter" | "manual";
  // for type 'filter':
  user_status?: string;
  has_orders?: boolean;
  registered_after?: string;
  registered_before?: string;
  // for type 'manual':
  phones?: string[];
}

export interface SmsCampaign {
  id: string;
  name: string;
  message: string;
  status: SmsCampaignStatus;
  recipient_filter: RecipientFilter | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmsLog {
  id: string;
  campaign_id: string;
  user_id: string | null;
  phone: string;
  message: string;
  status: string;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface SmsCampaignFormData {
  name: string;
  message: string;
  recipient_filter: RecipientFilter;
  scheduled_at: string | null;
}
