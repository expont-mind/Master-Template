"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUPON_TYPE_LABELS } from "@/constants";

import type { CouponFormData } from "./types";
import type { CouponType } from "@/types/database";

interface CouponDiscountSectionProps {
  formData: CouponFormData;
  deliveryFee: number;
  updateFormData: (updates: Partial<CouponFormData>) => void;
}

function getValueLabel(type: CouponType): string {
  if (type === "free_shipping") return "Хүргэлтийн үнэ (₮)";
  if (type === "percentage") return "Утга * (%)";
  return "Утга * (₮)";
}

export function CouponDiscountSection({
  formData,
  deliveryFee,
  updateFormData,
}: CouponDiscountSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хөнгөлөлт</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Төрөл *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                const type = value as CouponType;
                if (type === "free_shipping") {
                  updateFormData({ type, discount_value: deliveryFee });
                } else {
                  updateFormData({ type });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COUPON_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_value">{getValueLabel(formData.type)}</Label>
            <Input
              id="discount_value"
              type="number"
              value={formData.discount_value || ""}
              onChange={(e) =>
                updateFormData({
                  discount_value: e.target.value ? parseFloat(e.target.value) : 0,
                })
              }
              placeholder="0"
              min={0}
              max={formData.type === "percentage" ? 100 : undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min_purchase_amount">Хамгийн бага худалдан авалт</Label>
            <Input
              id="min_purchase_amount"
              type="number"
              value={formData.min_purchase_amount || ""}
              onChange={(e) =>
                updateFormData({
                  min_purchase_amount: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder="₮0"
              min={0}
            />
          </div>

          {formData.type === "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="max_discount_amount">Хамгийн их хөнгөлөлт (₮)</Label>
              <Input
                id="max_discount_amount"
                type="number"
                value={formData.max_discount_amount || ""}
                onChange={(e) =>
                  updateFormData({
                    max_discount_amount: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Хязгааргүй"
                min={0}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
