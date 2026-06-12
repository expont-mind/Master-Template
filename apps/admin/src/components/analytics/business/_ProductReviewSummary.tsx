"use client";

import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProductReviewSummaryProps {
  avgRating: number | null;
  reviewCount: number;
}

function ratingBarPercent(star: number, avgRating: number | null): number {
  if (avgRating === null) return 0;
  return Math.max(0, Math.min(100, (1 - Math.abs(star - avgRating) / 4) * 100));
}

export function ProductReviewSummary({ avgRating, reviewCount }: ProductReviewSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Үнэлгээний хураангуй
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviewCount === 0 ? (
          <div className="flex items-center justify-center h-[100px] text-muted-foreground">
            Үнэлгээ байхгүй байна
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{avgRating?.toFixed(1) ?? "—"}</p>
              <div className="mt-1 flex items-center justify-center gap-0.5">
                {[0, 1, 2, 3, 4].map((starIdx) => (
                  <Star
                    key={`star-${starIdx}`}
                    className={cn(
                      "h-4 w-4",
                      starIdx < Math.round(avgRating ?? 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground",
                    )}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{reviewCount} үнэлгээ</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = ratingBarPercent(star, avgRating);
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-muted-foreground">{star}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
