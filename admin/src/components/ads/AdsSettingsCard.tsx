"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AD_POSITIONS } from "./types";
import type { AdPosition } from "@/types/database";

interface AdsSettingsCardProps {
  position: AdPosition;
  onPositionChange: (value: AdPosition) => void;
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  sortOrder: number;
  onSortOrderChange: (value: number) => void;
}

export function AdsSettingsCard({
  position,
  onPositionChange,
  isActive,
  onIsActiveChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  sortOrder,
  onSortOrderChange,
}: AdsSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Байршил</Label>
          <Select value={position} onValueChange={(v) => onPositionChange(v as AdPosition)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AD_POSITIONS.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Идэвхтэй</Label>
            <p className="text-xs text-muted-foreground">
              Зар идэвхтэй бол харагдана
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Эхлэх огноо</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Дуусах огноо</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Эрэмбэ</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Бага тоотой нь эхэнд харагдана
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
