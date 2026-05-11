"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointer } from "lucide-react";
import type { Ad } from "./types";

interface AdsInfoCardProps {
  ad: Ad;
}

export function AdsInfoCard({ ad }: AdsInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистик</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Харсан:
          </span>
          <span className="font-medium">{ad.view_count}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <MousePointer className="h-4 w-4" />
            Дарсан:
          </span>
          <span className="font-medium">{ad.click_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">CTR:</span>
          <span className="font-medium">
            {ad.view_count > 0
              ? ((ad.click_count / ad.view_count) * 100).toFixed(2)
              : 0}%
          </span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Үүсгэсэн:</span>
            <span>{new Date(ad.created_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Шинэчилсэн:</span>
            <span>{new Date(ad.updated_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
