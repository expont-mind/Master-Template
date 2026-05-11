"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import type { ReviewWithDetails } from "./types";

interface ReviewUserCardProps {
  review: ReviewWithDetails;
}

export function ReviewUserCard({ review }: ReviewUserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Хэрэглэгч
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {review.users?.avatar_url ? (
              <img
                src={review.users.avatar_url}
                alt={[review.users.first_name, review.users.last_name].filter(Boolean).join(' ') || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {[review.users?.first_name, review.users?.last_name].filter(Boolean).join(' ') || "Нэргүй"}
            </p>
            <p className="text-sm text-muted-foreground">
              {review.users?.email}
            </p>
          </div>
        </div>
        <Link href={`/users/${review.user_id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Хэрэглэгчийг харах
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
