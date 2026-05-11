"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from "@/constants";
import type { PaymentMethod } from "@/types/database";

const WALLET_SHORT_NAMES: Record<string, string> = {
  "худалдаа хөгжлийн банк": "Худалдаа хөгжил",
};

function formatWalletName(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower === "p2p") return "Данс";
  if (WALLET_SHORT_NAMES[lower]) return WALLET_SHORT_NAMES[lower];
  if (lower === "м банк" || lower === "m bank") return raw;
  return raw.replace(/\s*банк\s*/gi, "").trim() || raw;
}

const WALLET_COLORS: Record<string, string> = {
  socialpay: "bg-green-50 text-green-600",
  monpay: "bg-orange-50 text-orange-600",
  most: "bg-blue-50 text-blue-600",
  hipay: "bg-red-50 text-red-600",
  "m bank": "bg-purple-50 text-purple-600",
  "хаан": "bg-emerald-50 text-emerald-600",
  "голомт": "bg-sky-50 text-sky-600",
  "худалдаа хөгжлийн": "bg-amber-50 text-amber-600",
  "хас": "bg-teal-50 text-teal-600",
  "төрийн": "bg-indigo-50 text-indigo-600",
  "капитрон": "bg-pink-50 text-pink-600",
};

function getWalletColor(wallet: string): string {
  const key = wallet.toLowerCase();
  if (WALLET_COLORS[key]) return WALLET_COLORS[key];
  for (const [k, v] of Object.entries(WALLET_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-blue-50 text-blue-600";
}

interface OrderPaymentCardProps {
  totalAmount: number;
  subtotal: number;
  deliveryFee?: number;
  couponDiscount?: number;
  actualPointsUsed?: number;
  pointsEarned?: number;
  paymentMethod?: PaymentMethod;
  paymentWallet?: string;
}

export function OrderPaymentCard({
  totalAmount,
  subtotal,
  deliveryFee = 0,
  couponDiscount = 0,
  actualPointsUsed = 0,
  pointsEarned = 0,
  paymentMethod,
  paymentWallet,
}: OrderPaymentCardProps) {
  const methodLabel = paymentMethod
    ? PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod
    : "Шилжүүлэг";
  const methodColor = paymentMethod
    ? PAYMENT_METHOD_COLORS[paymentMethod] || "bg-gray-100 text-gray-800"
    : "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Төлбөрийн мэдээлэл
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="flex items-center justify-between py-1.5 border-b border-border">
          <span className="text-sm text-foreground">Төлбөрийн хэрэгсэл</span>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className={`${methodColor} text-xs font-medium`}
            >
              {methodLabel}
            </Badge>
            {paymentWallet && (
              <Badge
                variant="secondary"
                className={`${getWalletColor(paymentWallet)} text-xs font-medium`}
              >
                {formatWalletName(paymentWallet)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between py-1.5 border-b border-border">
          <span className="text-sm text-foreground">Захиалгын үнийн дүн</span>
          <span className="text-sm font-medium">
            {subtotal.toLocaleString()}₮
          </span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex items-center justify-between py-1.5 border-b border-border">
            <span className="text-sm text-foreground">Хүргэлтийн төлбөр</span>
            <span className="text-sm font-medium">
              {deliveryFee.toLocaleString()}₮
            </span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between py-1.5 border-b border-border">
            <span className="text-sm text-foreground">Купоны хөнгөлөлт</span>
            <span className="text-sm font-medium text-teal-600">
              -{couponDiscount.toLocaleString()}₮
            </span>
          </div>
        )}
        {actualPointsUsed > 0 && (
          <div className="flex items-center justify-between py-1.5 border-b border-border">
            <span className="text-sm text-foreground">Хасагдсан point</span>
            <span className="text-sm font-medium text-teal-600">
              -{actualPointsUsed.toLocaleString()}₮
            </span>
          </div>
        )}
        {pointsEarned > 0 && (
          <div className="flex items-center justify-between py-1.5 border-b border-border">
            <span className="text-sm text-foreground">
              Нэмэгдсэн point (2%)
            </span>
            <span className="text-sm font-medium text-blue-600">
              +{pointsEarned.toLocaleString()}P
            </span>
          </div>
        )}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm font-semibold text-foreground">
            Нийт үнийн дүн
          </span>
          <span className="text-sm font-medium">
            {totalAmount.toLocaleString()}₮
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
