"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

interface UserStatsCardProps {
  ordersCount: number;
  totalSpent: number;
  pointBalance: number;
  totalPointsUsed: number;
  totalPointsEarned: number;
}

export function UserStatsCard({
  ordersCount,
  totalSpent,
  pointBalance,
  totalPointsUsed,
  totalPointsEarned,
}: UserStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Статистик
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Нийт захиалга:</span>
          <span className="font-medium">{ordersCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Нийт зарцуулсан:</span>
          <span className="font-medium">₮{totalSpent.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Point үлдэгдэл:</span>
          <span className="font-medium text-blue-600">{pointBalance.toLocaleString()}P</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Нийт олсон point:</span>
          <span className="font-medium text-green-600">+{totalPointsEarned.toLocaleString()}P</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Нийт ашигласан point:</span>
          <span className="font-medium text-teal-600">-{totalPointsUsed.toLocaleString()}P</span>
        </div>
      </CardContent>
    </Card>
  );
}
