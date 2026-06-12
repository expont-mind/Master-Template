"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Coupon, CouponFormData } from "./types";

interface CouponUsageSectionProps {
  formData: CouponFormData;
  updateFormData: (updates: Partial<CouponFormData>) => void;
  isEditMode: boolean;
  coupon: Coupon | null | undefined;
}

export function CouponUsageSection({
  formData,
  updateFormData,
  isEditMode,
  coupon,
}: CouponUsageSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ашиглалтын хязгаар</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usage_limit">Нийт ашиглалт</Label>
            <Input
              id="usage_limit"
              type="number"
              value={formData.usage_limit || ""}
              onChange={(e) =>
                updateFormData({
                  usage_limit: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Хязгааргүй"
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage_limit_per_user">Хэрэглэгч тус бүрийн ашиглалт</Label>
            <Input
              id="usage_limit_per_user"
              type="number"
              value={formData.usage_limit_per_user ?? ""}
              onChange={(e) =>
                updateFormData({
                  usage_limit_per_user: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Хязгааргүй"
              min={1}
            />
          </div>
        </div>

        {isEditMode && coupon && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Одоогийн ашиглалт: <span className="font-medium">{coupon.usage_count}</span>
              {coupon.usage_limit && ` / ${coupon.usage_limit}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
