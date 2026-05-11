"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FAQ } from "./types";

interface FaqInfoCardProps {
  faq: FAQ;
}

export function FaqInfoCard({ faq }: FaqInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Үүсгэсэн:</span>
          <span>
            {new Date(faq.created_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Шинэчилсэн:</span>
          <span>
            {new Date(faq.updated_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
