"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DeliveryEditCardProps {
  name: string;
  description: string;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  isFreeDeliveryEnabled: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  sortOrder: number;
  isLoading: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDeliveryFeeChange: (value: number) => void;
  onFreeDeliveryThresholdChange: (value: number | null) => void;
  onIsFreeDeliveryEnabledChange: (value: boolean) => void;
  onEstimatedDaysMinChange: (value: number) => void;
  onEstimatedDaysMaxChange: (value: number) => void;
  onIsActiveChange: (value: boolean) => void;
  onSortOrderChange: (value: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function DeliveryEditCard({
  name,
  description,
  deliveryFee,
  freeDeliveryThreshold,
  isFreeDeliveryEnabled,
  estimatedDaysMin,
  estimatedDaysMax,
  isActive,
  sortOrder,
  isLoading,
  error,
  onNameChange,
  onDescriptionChange,
  onDeliveryFeeChange,
  onFreeDeliveryThresholdChange,
  onIsFreeDeliveryEnabledChange,
  onEstimatedDaysMinChange,
  onEstimatedDaysMaxChange,
  onIsActiveChange,
  onSortOrderChange,
  onSubmit,
}: DeliveryEditCardProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Үндсэн мэдээлэл</CardTitle>
          <CardDescription>Хүргэлтийн бүсийн нэр, тайлбар</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Бүсийн нэр *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Улаанбаатар"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Тайлбар</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Улаанбаатар хот доторх хүргэлт"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Хүргэлтийн үнэ</CardTitle>
          <CardDescription>
            Хүргэлтийн төлбөр болон үнэгүй хүргэлтийн тохиргоо
          </CardDescription>
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
              onCheckedChange={(checked) =>
                onIsFreeDeliveryEnabledChange(checked as boolean)
              }
            />
            <Label htmlFor="isFreeDeliveryEnabled" className="cursor-pointer">
              Үнэгүй хүргэлт идэвхжүүлэх
            </Label>
          </div>

          {isFreeDeliveryEnabled && (
            <div className="space-y-2">
              <Label htmlFor="freeDeliveryThreshold">
                Үнэгүй хүргэлтийн босго дүн (₮)
              </Label>
              <Input
                id="freeDeliveryThreshold"
                type="number"
                value={freeDeliveryThreshold ?? ""}
                onChange={(e) =>
                  onFreeDeliveryThresholdChange(
                    e.target.value ? Number(e.target.value) : null
                  )
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

      <Card>
        <CardHeader>
          <CardTitle>Хүргэлтийн хугацаа</CardTitle>
          <CardDescription>
            Тооцоолсон хүргэлтийн хугацаа (өдрөөр)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedDaysMin">Хамгийн бага (өдөр)</Label>
              <Input
                id="estimatedDaysMin"
                type="number"
                value={estimatedDaysMin}
                onChange={(e) =>
                  onEstimatedDaysMinChange(Number(e.target.value))
                }
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDaysMax">Хамгийн их (өдөр)</Label>
              <Input
                id="estimatedDaysMax"
                type="number"
                value={estimatedDaysMax}
                onChange={(e) =>
                  onEstimatedDaysMaxChange(Number(e.target.value))
                }
                min={1}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-sm text-muted-foreground">
              Бага тоотой бүс эхэнд харагдана
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href="/deliveries">
          <Button type="button" variant="outline">
            Болих
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </Button>
      </div>
    </form>
  );
}
