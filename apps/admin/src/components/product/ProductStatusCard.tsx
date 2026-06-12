"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProductStatusCardProps {
  status: string;
  setStatus: (value: "active" | "inactive" | "draft") => void;
  manageQuantity: boolean;
  setManageQuantity: (value: boolean) => void;
  hasMultipleOptions: boolean;
  setHasMultipleOptions: (value: boolean) => void;
  isDeliverable: boolean;
  setIsDeliverable: (value: boolean) => void;
  isTicket: boolean;
  setIsTicket: (value: boolean) => void;
  hidePrice: boolean;
  setHidePrice: (value: boolean) => void;
  acceptFileOrImage: boolean;
  setAcceptFileOrImage: (value: boolean) => void;
}

export function ProductStatusCard({
  status,
  setStatus,
  manageQuantity,
  setManageQuantity,
  hasMultipleOptions,
  setHasMultipleOptions,
  isDeliverable,
  setIsDeliverable,
  isTicket,
  setIsTicket,
  hidePrice,
  setHidePrice,
  acceptFileOrImage,
  setAcceptFileOrImage,
}: ProductStatusCardProps) {
  const isActive = status === "active";

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <h3 className="text-lg font-semibold">Бүтээгдэхүүний төлөв</h3>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="product-status" className="cursor-pointer">
              Бүтээгдэхүүний төлөв
            </Label>
            <Switch
              id="product-status"
              checked={isActive}
              onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <Label htmlFor="manage-quantity" className="cursor-pointer leading-5">
              Бүтээгдэхүүний тоо ширхэгийг удирдана
            </Label>
            <Switch
              id="manage-quantity"
              checked={manageQuantity}
              onCheckedChange={setManageQuantity}
              className="shrink-0 mt-0.5"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <Label htmlFor="has-multiple-options" className="cursor-pointer leading-5">
              Энэ бүтээгдэхүүн нь олон сонголттой
            </Label>
            <Switch
              id="has-multiple-options"
              checked={hasMultipleOptions}
              onCheckedChange={setHasMultipleOptions}
              className="shrink-0 mt-0.5"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="deliverable" className="cursor-pointer">
              Хүргэлттэй бүтээгдэхүүн
            </Label>
            <Switch id="deliverable" checked={isDeliverable} onCheckedChange={setIsDeliverable} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-ticket" className="cursor-pointer">
              Тасалбар
            </Label>
            <Switch id="is-ticket" checked={isTicket} onCheckedChange={setIsTicket} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="hide-price" className="cursor-pointer">
              Үнэ нуух
            </Label>
            <Switch id="hide-price" checked={hidePrice} onCheckedChange={setHidePrice} />
          </div>

          <div className="flex items-start justify-between gap-4">
            <Label htmlFor="accept-file-or-image" className="cursor-pointer leading-5">
              Файл эсвэл зураг авах
            </Label>
            <Switch
              id="accept-file-or-image"
              checked={acceptFileOrImage}
              onCheckedChange={setAcceptFileOrImage}
              className="shrink-0 mt-0.5"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
