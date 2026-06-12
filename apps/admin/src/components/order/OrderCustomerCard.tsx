"use client";

import { User, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderCustomerCardProps {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    primary_phone: string | null;
  } | null;
}

export function OrderCustomerCard({ user }: OrderCustomerCardProps) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const displayName = fullName || `Зочин (${user?.id?.slice(0, 4).toUpperCase() || "XXXX"})`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Захиалагч</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center gap-2 h-9 py-1.5">
          <User className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium text-sidebar-accent-foreground">{displayName}</span>
        </div>
        {user?.primary_phone && (
          <div className="flex items-center gap-2 h-9 py-1.5">
            <Phone className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-sidebar-accent-foreground">
              {user.primary_phone}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
