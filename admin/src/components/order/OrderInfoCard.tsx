"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { parseAsUTC } from "@/lib/utils/formatters";

interface OrderInfoCardProps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function OrderInfoCard({
  id,
  createdAt,
  updatedAt,
}: OrderInfoCardProps) {
  const formatDate = (dateString: string) => {
    return parseAsUTC(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Мэдээлэл
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Захиалгын ID:</span>
          <span className="font-mono text-xs">{id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Захиалсан:</span>
          <span>{formatDate(createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Шинэчилсэн:</span>
          <span>{formatDate(updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
