"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS } from "@/constants";

import type { ReviewWithDetails } from "./types";

interface ReviewEditHeaderProps {
  review: ReviewWithDetails;
}

export function ReviewEditHeader({ review }: ReviewEditHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h2 className="text-3xl font-bold tracking-tight">Сэтгэгдлийн дэлгэрэнгүй</h2>
      </div>
      <Badge variant="secondary" className={REVIEW_STATUS_COLORS[review.status]}>
        {REVIEW_STATUS_LABELS[review.status]}
      </Badge>
    </div>
  );
}
