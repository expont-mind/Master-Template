"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { CouponFormData } from "./types";

interface CouponSidebarProps {
  formData: CouponFormData;
  updateFormData: (updates: Partial<CouponFormData>) => void;
}

function toUBDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CouponSidebar({ formData, updateFormData }: CouponSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Тохиргоо</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Идэвхтэй</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateFormData({ is_active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Хугацаа</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            from={formData.start_date ? new Date(formData.start_date) : undefined}
            to={formData.end_date ? new Date(formData.end_date) : undefined}
            onChange={({ from, to }) => {
              updateFormData({
                start_date: from
                  ? new Date(`${toUBDateKey(from)}T00:00:00+08:00`).toISOString()
                  : null,
                end_date: to ? new Date(`${toUBDateKey(to)}T23:59:59+08:00`).toISOString() : null,
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
