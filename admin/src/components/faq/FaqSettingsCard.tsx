"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTENT_STATUS_LABELS, FAQ_CATEGORIES } from "@/constants";
import type { ContentStatus } from "@/types/database";

interface FaqSettingsCardProps {
  status: ContentStatus;
  setStatus: (value: ContentStatus) => void;
  category: string;
  setCategory: (value: string) => void;
  sortOrder: number;
  setSortOrder: (value: number) => void;
}

export function FaqSettingsCard({
  status,
  setStatus,
  category,
  setCategory,
  sortOrder,
  setSortOrder,
}: FaqSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Төлөв</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ContentStatus)}
          >
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
            Зөвхөн "Нийтлэгдсэн" төлөвтэй асуултууд хэрэглэгчдэд харагдана
          </p>
        </div>

        <div className="space-y-2">
          <Label>Ангилал</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Эрэмбэ</Label>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Бага тоотой асуулт эхэнд харагдана
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
