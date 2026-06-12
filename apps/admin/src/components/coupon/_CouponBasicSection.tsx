"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CouponBasicSectionProps {
  code: string;
  onCodeChange: (code: string) => void;
  onGenerateCode: () => void;
}

export function CouponBasicSection({
  code,
  onCodeChange,
  onGenerateCode,
}: CouponBasicSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Үндсэн мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Купоны код *</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={code}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
              placeholder="SUMMER2024"
              className="font-mono"
            />
            <Button type="button" variant="outline" onClick={onGenerateCode}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
