"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeliverySettingsCardProps {
  isActive: boolean;
  sortOrder: number;
  onIsActiveChange: (value: boolean) => void;
  onSortOrderChange: (value: number) => void;
}

export function DeliverySettingsCard({
  isActive,
  sortOrder,
  onIsActiveChange,
  onSortOrderChange,
}: DeliverySettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
        <CardDescription>Бүсийн төлөв болон эрэмбэ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => onIsActiveChange(checked as boolean)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Идэвхтэй (Хэрэглэгчдэд харагдана)
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Эрэмбэ</Label>
          <Input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(Number(e.target.value))}
            min={0}
          />
          <p className="text-sm text-muted-foreground">Бага тоотой бүс эхэнд харагдана</p>
        </div>
      </CardContent>
    </Card>
  );
}
