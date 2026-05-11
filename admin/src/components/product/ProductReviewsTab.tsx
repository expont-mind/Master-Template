"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  MessageSquare,
  Pencil,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { MultiImageUpload } from "@/components/ui/image-upload";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS } from "@/constants";
import type { ReviewStatus } from "@/types/database";

interface ReviewWithImages {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  status: ReviewStatus;
  created_at: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

interface ProductReviewsTabProps {
  productId: string;
}

function DatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value, "yyyy.MM.dd", { locale: mn })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (date) {
              const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
              onChange(normalized);
              setOpen(false);
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function ProductReviewsTab({ productId }: ProductReviewsTabProps) {
  const queryClient = useQueryClient();

  // Add form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });
  const [newImages, setNewImages] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit form state
  const [editingReview, setEditingReview] = useState<ReviewWithImages | null>(
    null,
  );
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const queryKey = queryKeys.reviews.lists({ productId });

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminApi.getAllPaginated<ReviewWithImages>("reviews", {
        select:
          "id, user_id, product_id, rating, comment, images, status, created_at, users(id, first_name, last_name, email)",
        order: "created_at.desc",
        filters: { "product_id.eq": productId },
        limit: 100,
      }),
  });

  const reviews = data?.data ?? [];

  const insertMutation = useMutation({
    mutationFn: async (params: {
      name: string;
      rating: number;
      comment: string | null;
      date: Date;
      images: string[];
    }) => {
      const userId = crypto.randomUUID();
      const email = `review-${userId.slice(0, 8)}@admin.local`;

      await adminApi.insert("users", {
        id: userId,
        email,
        first_name: params.name,
        status: "active",
      });

      await adminApi.insert("reviews", {
        user_id: userId,
        product_id: productId,
        rating: params.rating,
        comment: params.comment,
        images: params.images.length > 0 ? params.images : null,
        status: "active",
        created_at: params.date.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      setIsAddOpen(false);
      resetAddForm();
    },
    onError: (err) => {
      setAddError(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const editMutation = useMutation({
    mutationFn: async (params: {
      reviewId: string;
      userId: string;
      name: string;
      rating: number;
      comment: string | null;
      date: Date;
      images: string[];
    }) => {
      // Update user name
      await adminApi.update("users", params.userId, {
        first_name: params.name,
      });

      // Update review
      await adminApi.update("reviews", params.reviewId, {
        rating: params.rating,
        comment: params.comment,
        images: params.images.length > 0 ? params.images : null,
        created_at: params.date.toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      setEditingReview(null);
    },
    onError: (err) => {
      setEditError(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      adminApi.update("reviews", id, {
        status,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("reviews", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });

  const resetAddForm = () => {
    setNewRating(0);
    setHoverRating(0);
    setNewComment("");
    setNewName("");
    const now = new Date();
    setNewDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
    setNewImages([]);
    setAddError(null);
  };

  const openEdit = (review: ReviewWithImages) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditHoverRating(0);
    setEditComment(review.comment || "");
    setEditName(getUserName(review));
    const d = new Date(review.created_at);
    setEditDate(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
    setEditImages(review.images || []);
    setEditError(null);
  };

  const handleAddReview = () => {
    if (newRating === 0 || !newName.trim()) return;
    setAddError(null);
    insertMutation.mutate({
      name: newName.trim(),
      rating: newRating,
      comment: newComment.trim() || null,
      date: newDate,
      images: newImages,
    });
  };

  const handleEditReview = () => {
    if (!editingReview || editRating === 0 || !editName.trim()) return;
    setEditError(null);
    editMutation.mutate({
      reviewId: editingReview.id,
      userId: editingReview.user_id,
      name: editName.trim(),
      rating: editRating,
      comment: editComment.trim() || null,
      date: editDate,
      images: editImages,
    });
  };

  const toggleStatus = (review: ReviewWithImages) => {
    const newStatus: ReviewStatus =
      review.status === "active" ? "hidden" : "active";
    updateMutation.mutate({ id: review.id, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  const getUserName = (review: ReviewWithImages) => {
    if (!review.users) return "Хэрэглэгч";
    const name = [review.users.first_name, review.users.last_name]
      .filter(Boolean)
      .join(" ");
    return name || review.users.email || "Хэрэглэгч";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Нийт {reviews.length} сэтгэгдэл
        </p>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetAddForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Сэтгэгдэл нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Сэтгэгдэл нэмэх</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Нэр <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Хэрэглэгчийн нэр"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Огноо
                  </label>
                  <DatePicker value={newDate} onChange={setNewDate} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Үнэлгээ <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (hoverRating || newRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Сэтгэгдэл
                </label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Сэтгэгдэл бичих..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Зураг
                </label>
                <MultiImageUpload
                  values={newImages}
                  onChange={setNewImages}
                  maxImages={3}
                />
              </div>
              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}
              <Button
                onClick={handleAddReview}
                disabled={
                  newRating === 0 || !newName.trim() || insertMutation.isPending
                }
                className="w-full"
              >
                {insertMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Нэмэх
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editingReview}
        onOpenChange={(open) => {
          if (!open) setEditingReview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Сэтгэгдэл засах</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Нэр <span className="text-destructive">*</span>
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Хэрэглэгчийн нэр"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Огноо
                </label>
                <DatePicker value={editDate} onChange={setEditDate} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Үнэлгээ <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star)}
                    onMouseEnter={() => setEditHoverRating(star)}
                    onMouseLeave={() => setEditHoverRating(0)}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (editHoverRating || editRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Сэтгэгдэл
              </label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Сэтгэгдэл бичих..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Зураг</label>
              <MultiImageUpload
                values={editImages}
                onChange={setEditImages}
                maxImages={3}
              />
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <Button
              onClick={handleEditReview}
              disabled={
                editRating === 0 || !editName.trim() || editMutation.isPending
              }
              className="w-full"
            >
              {editMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Хадгалах
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-3" />
            <p className="text-sm">Сэтгэгдэл байхгүй</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <Badge
                        variant="outline"
                        className={REVIEW_STATUS_COLORS[review.status] || ""}
                      >
                        {REVIEW_STATUS_LABELS[review.status] || review.status}
                      </Badge>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground">
                        {review.comment}
                      </p>
                    )}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2">
                        {review.images.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Review image ${i + 1}`}
                            className="h-16 w-16 rounded-md object-cover border"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{getUserName(review)}</span>
                      <span>&middot;</span>
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(review)}
                      title="Засах"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleStatus(review)}
                      disabled={updateMutation.isPending}
                      title={review.status === "active" ? "Нуух" : "Харуулах"}
                    >
                      {review.status === "active" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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
                            Энэ сэтгэгдлийг устгахдаа итгэлтэй байна уу? Энэ
                            үйлдлийг буцаах боломжгүй.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Цуцлах</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(review.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Устгах
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
