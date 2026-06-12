"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeliveryPricingCardProps {
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  isFreeDeliveryEnabled: boolean;
  onDeliveryFeeChange: (value: number) => void;
  onFreeDeliveryThresholdChange: (value: number | null) => void;
  onIsFreeDeliveryEnabledChange: (value: boolean) => void;
}

export function DeliveryPricingCard({
  deliveryFee,
  freeDeliveryThreshold,
  isFreeDeliveryEnabled,
  onDeliveryFeeChange,
  onFreeDeliveryThresholdChange,
  onIsFreeDeliveryEnabledChange,
}: DeliveryPricingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хүргэлтийн үнэ</CardTitle>
        <CardDescription>Хүргэлтийн төлбөр болон үнэгүй хүргэлтийн тохиргоо</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deliveryFee">Хүргэлтийн үнэ (₮) *</Label>
          <Input
            id="deliveryFee"
            type="number"
            value={deliveryFee}
            onChange={(e) => onDeliveryFeeChange(Number(e.target.value))}
            placeholder="5000"
            min={0}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFreeDeliveryEnabled"
            checked={isFreeDeliveryEnabled}
            onCheckedChange={(checked) => onIsFreeDeliveryEnabledChange(checked as boolean)}
          />
          <Label htmlFor="isFreeDeliveryEnabled" className="cursor-pointer">
            Үнэгүй хүргэлт идэвхжүүлэх
          </Label>
        </div>

        {isFreeDeliveryEnabled && (
          <div className="space-y-2">
            <Label htmlFor="freeDeliveryThreshold">Үнэгүй хүргэлтийн босго дүн (₮)</Label>
            <Input
              id="freeDeliveryThreshold"
              type="number"
              value={freeDeliveryThreshold ?? ""}
              onChange={(e) =>
                onFreeDeliveryThresholdChange(e.target.value ? Number(e.target.value) : null)
              }
              placeholder="50000"
              min={0}
            />
            <p className="text-sm text-muted-foreground">
              Энэ дүнгээс дээш захиалгад хүргэлт үнэгүй болно
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
