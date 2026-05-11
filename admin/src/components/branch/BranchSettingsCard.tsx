"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BranchSettingsCardProps {
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  sortOrder: number;
  onSortOrderChange: (value: number) => void;
}

export function BranchSettingsCard({
  isActive,
  onIsActiveChange,
  sortOrder,
  onSortOrderChange,
}: BranchSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Идэвхтэй</Label>
            <p className="text-xs text-muted-foreground">
              Салбар идэвхтэй бол харагдана
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Эрэмбэ</Label>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            placeholder="0"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Бага тоо = Эхэнд харагдана
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
