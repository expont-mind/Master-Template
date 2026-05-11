"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, MousePointer } from "lucide-react";
import type { Ad } from "./types";
import { AD_POSITION_LABELS } from "./types";

interface AdsItemProps {
  ad: Ad;
  onDelete: () => void;
}

export function AdsItem({ ad, onDelete }: AdsItemProps) {
  const isExpired = ad.end_date && new Date(ad.end_date) < new Date();
  const isScheduled = ad.start_date && new Date(ad.start_date) > new Date();

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {ad.image_url && (
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-16 h-16 object-cover rounded-lg border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/ads/${ad.id}`}
              className="font-medium hover:underline truncate"
            >
              {ad.title}
            </Link>
            <Badge variant="outline">
              {AD_POSITION_LABELS[ad.position]}
            </Badge>
            {isExpired ? (
              <Badge variant="destructive">Дууссан</Badge>
            ) : isScheduled ? (
              <Badge variant="secondary">Товлосон</Badge>
            ) : ad.is_active ? (
              <Badge variant="default">Идэвхтэй</Badge>
            ) : (
              <Badge variant="outline">Идэвхгүй</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {ad.view_count} харсан
            </span>
            <span className="flex items-center gap-1">
              <MousePointer className="h-3 w-3" />
              {ad.click_count} дарсан
            </span>
            {ad.start_date && (
              <span>
                {new Date(ad.start_date).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}
                {ad.end_date && ` - ${new Date(ad.end_date).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/ads/${ad.id}`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
