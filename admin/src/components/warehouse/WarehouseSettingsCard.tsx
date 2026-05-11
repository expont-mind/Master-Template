"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WAREHOUSE_TYPES } from "./types";
import type { WarehouseType } from "@/types/database";

interface WarehouseSettingsCardProps {
  type: WarehouseType;
  onTypeChange: (value: WarehouseType) => void;
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  isDefault: boolean;
  onIsDefaultChange: (value: boolean) => void;
}

export function WarehouseSettingsCard({
  type,
  onTypeChange,
  isActive,
  onIsActiveChange,
  isDefault,
  onIsDefaultChange,
}: WarehouseSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">Агуулахын төрөл</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Төрөл сонгох" />
            </SelectTrigger>
            <SelectContent>
              {WAREHOUSE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Идэвхтэй</Label>
            <p className="text-sm text-muted-foreground">
              Агуулах ашиглагдаж байгаа эсэх
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Үндсэн агуулах</Label>
            <p className="text-sm text-muted-foreground">
              Анхдагч агуулах болгох
            </p>
          </div>
          <Switch checked={isDefault} onCheckedChange={onIsDefaultChange} />
        </div>
      </CardContent>
    </Card>
  );
}
