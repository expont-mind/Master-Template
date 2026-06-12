"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useReviewEdit } from "@/hooks/useReviewEdit";

import { ReviewCommentCard } from "./ReviewCommentCard";
import { ReviewEditHeader } from "./ReviewEditHeader";
import { ReviewProductCard } from "./ReviewProductCard";
import { ReviewStatusCard } from "./ReviewStatusCard";
import { ReviewUserCard } from "./ReviewUserCard";

interface ReviewDetailsProps {
  id: string;
}

export function ReviewDetails({ id }: ReviewDetailsProps) {
  const {
    review,
    isLoading,
    isSaving,
    error,
    status,
    setStatus,
    handleSave,
    hasChanges,
    getProductImage,
  } = useReviewEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Сэтгэгдэл олдсонгүй</h3>
        <Link href="/reviews">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReviewEditHeader review={review} />

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <ReviewCommentCard review={review} />

      <div className="grid gap-6 md:grid-cols-3">
        <ReviewUserCard review={review} />
        <ReviewProductCard review={review} productImage={getProductImage()} />
        <ReviewStatusCard
          status={status}
          onStatusChange={setStatus}
          onSave={handleSave}
          hasChanges={hasChanges}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
