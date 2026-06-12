"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { resolveCustomerDisplayName, resolveDeliveryDisplay } from "./_orderCustomerDelivery";

import type { UserAddress } from "./types";

interface OrderAddress {
  city: string | null;
  district: string | null;
  sub_district: string | null;
  detail: string | null;
}

interface OrderCustomerDeliveryCardProps {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    primary_phone: string | null;
    secondary_phone: string | null;
    addresses: UserAddress[];
  } | null;
  orderAddress?: OrderAddress | null;
}

function DeliveryAddressBlock({
  zoneLabel,
  districtLine,
  detailLine,
  hasAddress,
}: {
  zoneLabel: string;
  districtLine: string | null;
  detailLine: string | null;
  hasAddress: boolean;
}) {
  if (!hasAddress) {
    return <p className="text-base text-muted-foreground py-2">Хаяг бүртгэгдээгүй</p>;
  }
  return (
    <>
      <div className="py-2.5 border-b border-border">
        <p className="text-base font-semibold text-foreground">Хүргэлтийн бүс: {zoneLabel}</p>
      </div>
      <div className="py-2.5">
        {districtLine && <p className="text-base font-semibold text-foreground">{districtLine}</p>}
        {detailLine && <p className="text-base font-semibold text-foreground mt-1">{detailLine}</p>}
      </div>
    </>
  );
}

function CustomerInfoBlock({
  userId,
  displayName,
  email,
  primaryPhone,
  secondaryPhone,
}: {
  userId: string;
  displayName: string;
  email: string;
  primaryPhone: string | null;
  secondaryPhone: string | null;
}) {
  return (
    <div className="pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">Захиалагч</p>
        <Link
          href={`/users/${userId}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Дэлгэрэнгүй
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{displayName}</p>
        <p className="text-base font-semibold text-foreground">{email}</p>
        {primaryPhone && <p className="text-base font-semibold text-foreground">{primaryPhone}</p>}
        {secondaryPhone && (
          <p className="text-base font-semibold text-foreground">{secondaryPhone}</p>
        )}
      </div>
    </div>
  );
}

export function OrderCustomerDeliveryCard({ user, orderAddress }: OrderCustomerDeliveryCardProps) {
  const displayName = resolveCustomerDisplayName(user);
  const delivery = resolveDeliveryDisplay(user, orderAddress);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хүргэлтийн хаяг</CardTitle>
      </CardHeader>
      <CardContent className=" space-y-0">
        {/* Delivery Address Section */}
        <div className="pt-4 border-t border-border">
          <DeliveryAddressBlock
            zoneLabel={delivery.zoneLabel}
            districtLine={delivery.districtLine}
            detailLine={delivery.detailLine}
            hasAddress={delivery.hasAddress}
          />
        </div>

        {/* Customer Info Section */}
        {user && (
          <CustomerInfoBlock
            userId={user.id}
            displayName={displayName}
            email={user.email}
            primaryPhone={user.primary_phone}
            secondaryPhone={user.secondary_phone}
          />
        )}
      </CardContent>
    </Card>
  );
}
