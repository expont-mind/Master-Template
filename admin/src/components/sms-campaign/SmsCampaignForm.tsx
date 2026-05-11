"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Send, Loader2, Users, Clock } from "lucide-react";
import { USER_STATUS_LABELS } from "@/constants";
import { useSmsCampaignEdit } from "@/hooks/useSmsCampaignEdit";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";

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
  const [timing, setTiming] = useState<"now" | "scheduled">("now");
  const [manualPhones, setManualPhones] = useState(
    (formData.recipient_filter.phones ?? []).join(",")
  );

  const isSent = campaign?.status === "sent" || campaign?.status === "sending";
  const messageLength = formData.message.length;

  // Auto-preview when filter changes
  useEffect(() => {
    if (formData.recipient_filter.type !== "manual") {
      previewRecipients();
    }
  }, [formData.recipient_filter.type, formData.recipient_filter.user_status, formData.recipient_filter.has_orders, formData.recipient_filter.registered_after, formData.recipient_filter.registered_before]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle>SMS мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Нэр</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Кампанийн нэр"
                  disabled={isSent}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Мессеж</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => updateFormData({ message: e.target.value })}
                  placeholder="SMS мессежийн текст..."
                  rows={4}
                  disabled={isSent}
                />
                <p className="text-xs text-muted-foreground">
                  {messageLength} тэмдэгт
                  {messageLength > 160 && (
                    <span className="text-orange-600">
                      {" "}(160-аас давсан, {Math.ceil(messageLength / 153)} SMS болно)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Хүлээн авагчид
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.recipient_filter.type}
                onValueChange={(value: string) =>
                  updateFilter({ type: value as "all" | "filter" | "manual" })
                }
                disabled={isSent}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Бүх хэрэглэгч (утасны дугаартай)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="filter" id="filter" />
                  <Label htmlFor="filter">Шүүлтүүрээр</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">Гар оруулга</Label>
                </div>
              </RadioGroup>

              {/* Filter options */}
              {formData.recipient_filter.type === "filter" && (
                <div className="ml-6 space-y-4 border-l-2 pl-4">
                  <div className="space-y-2">
                    <Label>Хэрэглэгчийн төлөв</Label>
                    <Select
                      value={formData.recipient_filter.user_status ?? "all"}
                      onValueChange={(value) =>
                        updateFilter({
                          user_status: value === "all" ? undefined : value,
                        })
                      }
                      disabled={isSent}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Бүгд" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Бүгд</SelectItem>
                        {Object.entries(USER_STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_orders"
                      checked={formData.recipient_filter.has_orders ?? false}
                      onCheckedChange={(checked) =>
                        updateFilter({ has_orders: checked === true })
                      }
                      disabled={isSent}
                    />
                    <Label htmlFor="has_orders">Захиалга хийсэн хэрэглэгч</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Бүртгүүлсэн огноо</Label>
                    <DateRangePicker
                      from={
                        formData.recipient_filter.registered_after
                          ? new Date(formData.recipient_filter.registered_after)
                          : undefined
                      }
                      to={
                        formData.recipient_filter.registered_before
                          ? new Date(formData.recipient_filter.registered_before)
                          : undefined
                      }
                      onChange={(range) =>
                        updateFilter({
                          registered_after: range.from
                            ? range.from.toISOString().split("T")[0]
                            : undefined,
                          registered_before: range.to
                            ? range.to.toISOString().split("T")[0]
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Manual phone input */}
              {formData.recipient_filter.type === "manual" && (
                <div className="ml-6 space-y-2 border-l-2 pl-4">
                  <Label>Утасны дугаарууд (мөр бүрт нэг)</Label>
                  <Textarea
                    value={manualPhones}
                    onChange={(e) => {
                      setManualPhones(e.target.value);
                      const phones = e.target.value
                        .split(/[,\n]+/)
                        .map((p) => p.trim())
                        .filter((p) => p.length > 0);
                      updateFilter({ phones });
                    }}
                    placeholder={"99001122,99003344,88112233"}
                    rows={6}
                    disabled={isSent}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.recipient_filter.phones ?? []).length} дугаар
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Хүлээн авагчид</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                {isPreviewLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                ) : formData.recipient_filter.type === "manual" ? (
                  <p className="text-3xl font-bold">
                    {(formData.recipient_filter.phones ?? []).length}
                  </p>
                ) : recipientCount !== null ? (
                  <p className="text-3xl font-bold">{recipientCount}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">—</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">хүн</p>
              </div>
              {formData.recipient_filter.type !== "manual" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={previewRecipients}
                  disabled={isPreviewLoading}
                >
                  {isPreviewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Тоо шинэчлэх
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timing */}
          {!isSent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Илгээх хугацаа
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={timing}
                  onValueChange={(v: string) => {
                    setTiming(v as "now" | "scheduled");
                    if (v === "now") {
                      updateFormData({ scheduled_at: null });
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="timing-now" />
                    <Label htmlFor="timing-now">Одоо илгээх</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="timing-scheduled" />
                    <Label htmlFor="timing-scheduled">Төлөвлөх</Label>
                  </div>
                </RadioGroup>

                {timing === "scheduled" && (
                  <DateTimePicker
                    value={
                      formData.scheduled_at
                        ? new Date(formData.scheduled_at)
                        : undefined
                    }
                    onChange={(date) =>
                      updateFormData({
                        scheduled_at: date ? date.toISOString() : null,
                      })
                    }
                    placeholder="Илгээх огноо, цаг сонгох"
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {!isSent && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving || isSending}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Ноорог хадгалах
                </Button>

                {timing === "scheduled" ? (
                  <Button
                    className="w-full"
                    onClick={() => handleSave("scheduled")}
                    disabled={isSaving || isSending}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Clock className="mr-2 h-4 w-4" />
                    Төлөвлөх
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => setSendConfirmOpen(true)}
                    disabled={isSaving || isSending}
                  >
                    {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Send className="mr-2 h-4 w-4" />
                    Илгээх
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sent stats */}
          {isSent && campaign && (
            <Card>
              <CardHeader>
                <CardTitle>Илгээсэн статистик</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Нийт</span>
                  <span className="font-medium">{campaign.recipient_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Амжилттай</span>
                  <span className="font-medium text-green-600">{campaign.sent_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Амжилтгүй</span>
                  <span className="font-medium text-red-600">{campaign.failed_count}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send confirmation dialog */}
      <ConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="SMS илгээх"
        description={`${
          formData.recipient_filter.type === "manual"
            ? (formData.recipient_filter.phones ?? []).length
            : recipientCount ?? "?"
        } хүнд SMS илгээхдээ итгэлтэй байна уу?`}
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
