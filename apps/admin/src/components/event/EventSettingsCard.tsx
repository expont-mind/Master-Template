"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTENT_STATUS_LABELS } from "@/constants";

import type { ContentStatus } from "@/types/database";

interface EventSettingsCardProps {
  status: ContentStatus;
  onStatusChange: (status: ContentStatus) => void;
}

export function EventSettingsCard({ status, onStatusChange }: EventSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Төлөв</Label>
          <Select value={status} onValueChange={(v) => onStatusChange(v as ContentStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONTENT_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            • Ноорог - Зөвхөн админд харагдана
            <br />
            • Нийтлэгдсэн - Бүх хэрэглэгчид харагдана
            <br />• Архивлагдсан - Нуугдсан
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
