"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
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

export function OrderCustomerDeliveryCard({
  user,
  orderAddress,
}: OrderCustomerDeliveryCardProps) {
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");
  const displayName =
    fullName || `Зочин (${user?.id?.slice(0, 4).toUpperCase() || "XXXX"})`;

  // Prefer order's snapshot address; fall back to user's default address for old orders
  const hasOrderAddress = orderAddress?.city || orderAddress?.district || orderAddress?.detail;
  const address = hasOrderAddress
    ? orderAddress
    : user?.addresses?.find((a) => a.is_default) || user?.addresses?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хүргэлтийн хаяг</CardTitle>
      </CardHeader>
      <CardContent className=" space-y-0">
        {/* Delivery Address Section */}
        <div className="pt-4 border-t border-border">
          {address ? (
            <>
              <div className="py-2.5 border-b border-border">
                <p className="text-base font-semibold text-foreground">
                  Хүргэлтийн бүс: {address.city || "Улаанбаатар"}
                </p>
              </div>
              <div className="py-2.5">
                {address.district && (
                  <p className="text-base font-semibold text-foreground">
                    {address.district}
                    {address.sub_district && `, ${address.sub_district}`}
                  </p>
                )}
                {address.detail && (
                  <p className="text-base font-semibold text-foreground mt-1">
                    {address.detail}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-base text-muted-foreground py-2">
              Хаяг бүртгэгдээгүй
            </p>
          )}
        </div>

        {/* Customer Info Section */}
        {user && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Захиалагч</p>
              <Link
                href={`/users/${user.id}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Дэлгэрэнгүй
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-base font-semibold text-foreground">
                {user.email}
              </p>
              {user.primary_phone && (
                <p className="text-base font-semibold text-foreground">
                  {user.primary_phone}
                </p>
              )}
              {user.secondary_phone && (
                <p className="text-base font-semibold text-foreground">
                  {user.secondary_phone}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
