"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Star, Calendar } from "lucide-react";
import type { ReviewWithDetails } from "./types";

interface ReviewCommentCardProps {
  review: ReviewWithDetails;
}

export function ReviewCommentCard({ review }: ReviewCommentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Сэтгэгдэл
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {renderStars(review.rating)}
          <span className="text-2xl font-bold">{review.rating}/5</span>
        </div>

        {review.comment ? (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-foreground whitespace-pre-wrap">
              "{review.comment}"
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground italic">Сэтгэгдэл бичээгүй</p>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Бичсэн: {formatDate(review.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
