"use client";

// Single review card used inside ProductReviewsTab's review list.

import { Eye, EyeOff, Pencil, Star, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { REVIEW_STATUS_COLORS, REVIEW_STATUS_LABELS } from "@/constants";

import { formatReviewDate, getReviewUserName, type ReviewWithImages } from "./_useProductReviews";

interface ReviewListItemProps {
  review: ReviewWithImages;
  onEdit: (review: ReviewWithImages) => void;
  onToggleStatus: (review: ReviewWithImages) => void;
  onDelete: (id: string) => void;
  isToggleDisabled: boolean;
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewActions({
  review,
  onEdit,
  onToggleStatus,
  onDelete,
  isToggleDisabled,
}: ReviewListItemProps) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(review)}
        title="Засах"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onToggleStatus(review)}
        disabled={isToggleDisabled}
        title={review.status === "active" ? "Нуух" : "Харуулах"}
      >
        {review.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Устгах"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сэтгэгдэл устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ сэтгэгдлийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(review.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ReviewListItem({
  review,
  onEdit,
  onToggleStatus,
  onDelete,
  isToggleDisabled,
}: ReviewListItemProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3">
              <ReviewStars rating={review.rating} />
              <Badge variant="outline" className={REVIEW_STATUS_COLORS[review.status] || ""}>
                {REVIEW_STATUS_LABELS[review.status] || review.status}
              </Badge>
            </div>
            {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2">
                {review.images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`Review image ${i + 1}`}
                    className="h-16 w-16 rounded-md object-cover border"
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{getReviewUserName(review)}</span>
              <span>&middot;</span>
              <span>{formatReviewDate(review.created_at)}</span>
            </div>
          </div>
          <ReviewActions
            review={review}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            isToggleDisabled={isToggleDisabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
