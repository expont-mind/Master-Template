"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from "@/constants";

import { formatWalletName, getWalletColor } from "./_paymentWalletHelpers";

import type { PaymentMethod } from "@/types/database";

interface RowProps {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  noBorder?: boolean;
}

function PaymentRow({ label, value, bold = false, noBorder = false }: RowProps) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${noBorder ? "" : "border-b border-border"}`}
    >
      <span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-foreground"}`}>
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
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

function PaymentMethodHeader({
  paymentMethod,
  paymentWallet,
}: {
  paymentMethod?: PaymentMethod;
  paymentWallet?: string;
}) {
  const methodLabel = paymentMethod
    ? PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod
    : "Шилжүүлэг";
  const methodColor = paymentMethod
    ? PAYMENT_METHOD_COLORS[paymentMethod] || "bg-gray-100 text-gray-800"
    : "bg-gray-100 text-gray-800";

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border">
      <span className="text-sm text-foreground">Төлбөрийн хэрэгсэл</span>
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className={`${methodColor} text-xs font-medium`}>
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
  );
}

function ConditionalRows({
  deliveryFee,
  couponDiscount,
  actualPointsUsed,
  pointsEarned,
}: {
  deliveryFee: number;
  couponDiscount: number;
  actualPointsUsed: number;
  pointsEarned: number;
}) {
  const rows: { key: string; node: React.ReactNode }[] = [];
  if (deliveryFee > 0) {
    rows.push({
      key: "delivery",
      node: <PaymentRow label="Хүргэлтийн төлбөр" value={`${deliveryFee.toLocaleString()}₮`} />,
    });
  }
  if (couponDiscount > 0) {
    rows.push({
      key: "coupon",
      node: (
        <PaymentRow
          label="Купоны хөнгөлөлт"
          value={<span className="text-teal-600">-{couponDiscount.toLocaleString()}₮</span>}
        />
      ),
    });
  }
  if (actualPointsUsed > 0) {
    rows.push({
      key: "points-used",
      node: (
        <PaymentRow
          label="Хасагдсан point"
          value={<span className="text-teal-600">-{actualPointsUsed.toLocaleString()}₮</span>}
        />
      ),
    });
  }
  if (pointsEarned > 0) {
    rows.push({
      key: "points-earned",
      node: (
        <PaymentRow
          label="Нэмэгдсэн point (2%)"
          value={<span className="text-blue-600">+{pointsEarned.toLocaleString()}P</span>}
        />
      ),
    });
  }
  return (
    <>
      {rows.map((r) => (
        <React.Fragment key={r.key}>{r.node}</React.Fragment>
      ))}
    </>
  );
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Төлбөрийн мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <PaymentMethodHeader paymentMethod={paymentMethod} paymentWallet={paymentWallet} />
        <PaymentRow label="Захиалгын үнийн дүн" value={`${subtotal.toLocaleString()}₮`} />
        <ConditionalRows
          deliveryFee={deliveryFee}
          couponDiscount={couponDiscount}
          actualPointsUsed={actualPointsUsed}
          pointsEarned={pointsEarned}
        />
        <PaymentRow
          label="Нийт үнийн дүн"
          value={`${totalAmount.toLocaleString()}₮`}
          bold
          noBorder
        />
      </CardContent>
    </Card>
  );
}
