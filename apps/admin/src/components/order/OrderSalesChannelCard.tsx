"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/utils/brand-config";

interface OrderSalesChannelCardProps {
  channel?: string;
}

export function OrderSalesChannelCard({ channel = BRAND.name }: OrderSalesChannelCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <span className="text-sm font-medium text-foreground">Борлуулалтын суваг</span>
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <circle cx="7" cy="7" r="6" fill="#000" />
          </svg>
          <span className="text-sm font-medium text-sidebar-accent-foreground">{channel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
