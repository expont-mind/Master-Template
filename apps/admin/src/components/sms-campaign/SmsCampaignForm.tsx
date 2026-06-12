"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSmsCampaignEdit } from "@/hooks/useSmsCampaignEdit";

import { CampaignInfoCard } from "./_components/CampaignInfoCard";
import { buildSendDescription, CampaignSidebar } from "./_components/CampaignSidebar";
import { RecipientsCard } from "./_components/RecipientsCard";
import { type Timing } from "./_components/TimingCard";

interface SmsCampaignFormProps {
  id?: string;
}

export function SmsCampaignForm({ id }: SmsCampaignFormProps) {
  const router = useRouter();
  const {
    formData,
    isLoading,
    isSaving,
    isSending,
    error,
    isEditMode,
    recipientCount,
    isPreviewLoading,
    updateFormData,
    updateFilter,
    previewRecipients,
    handleSave,
    handleSend,
    campaign,
  } = useSmsCampaignEdit(id);

  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [timing, setTiming] = useState<Timing>("now");
  const [manualPhones, setManualPhones] = useState(
    (formData.recipient_filter.phones ?? []).join(","),
  );

  const isSent = campaign?.status === "sent" || campaign?.status === "sending";

  // Auto-preview when filter changes
  useEffect(() => {
    if (formData.recipient_filter.type !== "manual") {
      previewRecipients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.recipient_filter.type,
    formData.recipient_filter.user_status,
    formData.recipient_filter.has_orders,
    formData.recipient_filter.registered_after,
    formData.recipient_filter.registered_before,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const phoneCount = (formData.recipient_filter.phones ?? []).length;
  const handleChangeTiming = (next: Timing) => {
    setTiming(next);
    if (next === "now") updateFormData({ scheduled_at: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sms-campaigns")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-3xl font-bold tracking-tight">
            {isEditMode ? "SMS кампани засах" : "Шинэ SMS кампани"}
          </p>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CampaignInfoCard
            name={formData.name}
            message={formData.message}
            disabled={isSent}
            onChange={updateFormData}
          />
          <RecipientsCard
            filter={formData.recipient_filter}
            disabled={isSent}
            manualPhones={manualPhones}
            onChangeManualPhones={setManualPhones}
            onUpdateFilter={updateFilter}
          />
        </div>
        <CampaignSidebar
          formData={formData}
          phoneCount={phoneCount}
          recipientCount={recipientCount}
          isPreviewLoading={isPreviewLoading}
          isSaving={isSaving}
          isSending={isSending}
          isSent={isSent}
          campaign={campaign}
          timing={timing}
          onPreview={previewRecipients}
          onChangeTiming={handleChangeTiming}
          onChangeScheduledAt={(iso) => updateFormData({ scheduled_at: iso })}
          onSaveDraft={() => handleSave("draft")}
          onSchedule={() => handleSave("scheduled")}
          onConfirmSend={() => setSendConfirmOpen(true)}
        />
      </div>

      <ConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="SMS илгээх"
        description={buildSendDescription(formData.recipient_filter, recipientCount)}
        confirmText="Илгээх"
        cancelText="Цуцлах"
        onConfirm={() => {
          setSendConfirmOpen(false);
          handleSend();
        }}
      />
    </div>
  );
}
