"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { REVIEW_STATUS_LABELS } from "@/constants";
import type { ReviewStatus } from "@/types/database";

interface ReviewStatusCardProps {
  status: ReviewStatus;
  onStatusChange: (status: ReviewStatus) => void;
  onSave: () => void;
  hasChanges: boolean;
  isSaving: boolean;
}

export function ReviewStatusCard({
  status,
  onStatusChange,
  onSave,
  hasChanges,
  isSaving,
}: ReviewStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Төлөв өөрчлөх</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Сэтгэгдлийн төлөв</Label>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as ReviewStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REVIEW_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            • Идэвхтэй - Бүх хэрэглэгчид харагдана
            <br />
            • Нуусан - Зөвхөн админд харагдана
            <br />• Тэмдэглэсэн - Шалгах шаардлагатай
          </p>
        </div>

        <Button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
