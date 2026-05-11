"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { SmsCampaign, SmsCampaignFormData, RecipientFilter } from "@/components/sms-campaign/types";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

const defaultFilter: RecipientFilter = { type: "all" };

const defaultFormData: SmsCampaignFormData = {
  name: "",
  message: "",
  recipient_filter: defaultFilter,
  scheduled_at: null,
};

export function useSmsCampaignEdit(id?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SmsCampaignFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const isEditMode = !!id;

  const { data: campaign = null, isLoading } = useQuery({
    queryKey: queryKeys.smsCampaigns.detail(id!),
    queryFn: () => adminApi.getById<SmsCampaign>("sms_campaigns", id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        message: campaign.message,
        recipient_filter: (campaign.recipient_filter as RecipientFilter) ?? defaultFilter,
        scheduled_at: campaign.scheduled_at,
      });
    }
  }, [campaign]);

  const updateFormData = (updates: Partial<SmsCampaignFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setError(null);
  };

  const updateFilter = (updates: Partial<RecipientFilter>) => {
    setFormData((prev) => ({
      ...prev,
      recipient_filter: { ...prev.recipient_filter, ...updates },
    }));
    setRecipientCount(null);
  };

  const previewRecipients = useCallback(async () => {
    setIsPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/sms/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_filter: formData.recipient_filter }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRecipientCount(data.count);
      }
    } catch {
      setError("Хүлээн авагчдыг тооцоолоход алдаа гарлаа");
    } finally {
      setIsPreviewLoading(false);
    }
  }, [formData.recipient_filter]);

  const handleSave = async (status: "draft" | "scheduled" = "draft") => {
    if (!formData.name.trim()) {
      setError("Кампанийн нэрийг заавал оруулна уу.");
      return;
    }
    if (!formData.message.trim()) {
      setError("Мессежийн текстийг заавал оруулна уу.");
      return;
    }
    if (status === "scheduled" && !formData.scheduled_at) {
      setError("Төлөвлөсөн огноог заавал сонгоно уу.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        message: formData.message,
        recipient_filter: formData.recipient_filter,
        scheduled_at: formData.scheduled_at,
        status,
        updated_at: new Date().toISOString(),
      };

      if (isEditMode && id) {
        await adminApi.update("sms_campaigns", id, payload);
      } else {
        await adminApi.insert("sms_campaigns", payload);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.smsCampaigns.all });
      router.push("/sms-campaigns");
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Кампани хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!formData.name.trim()) {
      setError("Кампанийн нэрийг заавал оруулна уу.");
      return;
    }
    if (!formData.message.trim()) {
      setError("Мессежийн текстийг заавал оруулна уу.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Save/update campaign first
      const payload = {
        name: formData.name,
        message: formData.message,
        recipient_filter: formData.recipient_filter,
        status: "draft" as const,
        updated_at: new Date().toISOString(),
      };

      let campaignId = id;
      if (isEditMode && id) {
        await adminApi.update("sms_campaigns", id, payload);
      } else {
        const result = await adminApi.insert<SmsCampaign>("sms_campaigns", payload);
        campaignId = result.id;
      }

      // Send the campaign
      const res = await fetch("/api/admin/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      const data = await res.json();
      if (data.error) {
        setError(
          data.failed_count
            ? `${data.sent_count ?? 0} амжилттай, ${data.failed_count} амжилтгүй. Алдаа: ${data.error}`
            : data.error,
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.smsCampaigns.all });
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.smsCampaigns.all });
      router.push("/sms-campaigns");
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "SMS илгээхэд алдаа гарлаа."));
    } finally {
      setIsSending(false);
    }
  };

  return {
    campaign,
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
  };
}
