"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DELIVERY_ZONES_CONFIG } from "@/lib/utils/brand-config";

interface OrderDeliveryAddressCardProps {
  deliveryZone?: string;
  address?: string;
  recipientName?: string;
  phoneNumbers?: string[];
}

export function OrderDeliveryAddressCard({
  deliveryZone = DELIVERY_ZONES_CONFIG.capital,
  address,
  recipientName,
  phoneNumbers = [],
}: OrderDeliveryAddressCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Хүргэлтийн хаяг
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="py-2.5 border-b border-border">
          <p className="text-sm font-medium text-foreground">
            Хүргэлтийн бүс: {deliveryZone}
          </p>
        </div>
        {address && (
          <div className="py-2.5">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {address}
            </p>
            {(recipientName || phoneNumbers.length > 0) && (
              <div className="mt-1 space-y-0.5">
                {recipientName && (
                  <p className="text-sm text-slate-500">{recipientName}</p>
                )}
                {phoneNumbers.length > 0 && (
                  <div className="flex items-center gap-0.5 text-sm text-slate-500">
                    {phoneNumbers.map((phone, index) => (
                      <span key={index}>
                        {phone}
                        {index < phoneNumbers.length - 1 && (
                          <span className="mx-0.5">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
