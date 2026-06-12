"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { SmsCampaign } from "@/components/sms-campaign/types";

export function SentStatsCard({ campaign }: { campaign: SmsCampaign }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Илгээсэн статистик</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Нийт</span>
          <span className="font-medium">{campaign.recipient_count}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Амжилттай</span>
          <span className="font-medium text-green-600">{campaign.sent_count}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Амжилтгүй</span>
          <span className="font-medium text-red-600">{campaign.failed_count}</span>
        </div>
      </CardContent>
    </Card>
  );
}
