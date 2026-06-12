"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BankAccountSettingsCardProps {
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  isDefault: boolean;
  onIsDefaultChange: (value: boolean) => void;
}

export function BankAccountSettingsCard({
  isActive,
  onIsActiveChange,
  isDefault,
  onIsDefaultChange,
}: BankAccountSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Идэвхтэй</Label>
            <p className="text-sm text-muted-foreground">Данс ашиглагдаж байгаа эсэх</p>
          </div>
          <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Үндсэн данс</Label>
            <p className="text-sm text-muted-foreground">Анхдагч данс болгох</p>
          </div>
          <Switch checked={isDefault} onCheckedChange={onIsDefaultChange} />
        </div>
      </CardContent>
    </Card>
  );
}
