"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Event } from "./types";

interface EventInfoCardProps {
  event: Event;
}

export function EventInfoCard({ event }: EventInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Үүсгэсэн:</span>
          <span>
            {new Date(event.created_at).toLocaleDateString("mn-MN", {
              timeZone: "Asia/Ulaanbaatar",
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Шинэчилсэн:</span>
          <span>
            {new Date(event.updated_at).toLocaleDateString("mn-MN", {
              timeZone: "Asia/Ulaanbaatar",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
