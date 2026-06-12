"use client";

import { CampaignActionsCard } from "./CampaignActionsCard";
import { RecipientPreviewCard } from "./RecipientPreviewCard";
import { SentStatsCard } from "./SentStatsCard";
import { TimingCard, type Timing } from "./TimingCard";

import type {
  RecipientFilter,
  SmsCampaign,
  SmsCampaignFormData,
} from "@/components/sms-campaign/types";

interface CampaignSidebarProps {
  formData: SmsCampaignFormData;
  phoneCount: number;
  recipientCount: number | null;
  isPreviewLoading: boolean;
  isSaving: boolean;
  isSending: boolean;
  isSent: boolean;
  campaign: SmsCampaign | null;
  timing: Timing;
  onPreview: () => void;
  onChangeTiming: (t: Timing) => void;
  onChangeScheduledAt: (iso: string | null) => void;
  onSaveDraft: () => void;
  onSchedule: () => void;
  onConfirmSend: () => void;
}

export function CampaignSidebar(props: CampaignSidebarProps) {
  const {
    formData,
    phoneCount,
    recipientCount,
    isPreviewLoading,
    isSaving,
    isSending,
    isSent,
    campaign,
    timing,
    onPreview,
    onChangeTiming,
    onChangeScheduledAt,
    onSaveDraft,
    onSchedule,
    onConfirmSend,
  } = props;

  return (
    <div className="space-y-6">
      <RecipientPreviewCard
        filterType={formData.recipient_filter.type}
        phoneCount={phoneCount}
        recipientCount={recipientCount}
        isPreviewLoading={isPreviewLoading}
        onPreview={onPreview}
      />
      {!isSent && (
        <TimingCard
          timing={timing}
          scheduledAt={formData.scheduled_at}
          onChangeTiming={onChangeTiming}
          onChangeScheduledAt={onChangeScheduledAt}
        />
      )}
      {!isSent && (
        <CampaignActionsCard
          timing={timing}
          isSaving={isSaving}
          isSending={isSending}
          onSaveDraft={onSaveDraft}
          onSchedule={onSchedule}
          onConfirmSend={onConfirmSend}
        />
      )}
      {isSent && campaign && <SentStatsCard campaign={campaign} />}
    </div>
  );
}

export function buildSendDescription(
  filter: RecipientFilter,
  recipientCount: number | null,
): string {
  const target = filter.type === "manual" ? (filter.phones ?? []).length : (recipientCount ?? "?");
  return `${target} хүнд SMS илгээхдээ итгэлтэй байна уу?`;
}
