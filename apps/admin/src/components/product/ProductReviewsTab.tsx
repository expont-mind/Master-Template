"use client";

// Reviews tab inside the product editor. Lists reviews with inline
// status toggle / delete / edit, plus an "add review" dialog. State +
// mutations are in useProductReviews; row UI is ReviewListItem;
// shared form fields are ReviewFormFields.

import { Loader2, MessageSquare, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ReviewFormFields } from "./_ReviewFormFields";
import { ReviewListItem } from "./_ReviewListItem";
import { useProductReviews } from "./_useProductReviews";

interface ProductReviewsTabProps {
  productId: string;
}

function AddReviewDialog({ state }: { state: ReturnType<typeof useProductReviews> }) {
  const { isAddOpen, setIsAddOpen, resetAddForm, addForm } = state;
  return (
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
        <ReviewFormFields
          name={addForm.newName}
          setName={addForm.setNewName}
          date={addForm.newDate}
          setDate={addForm.setNewDate}
          rating={addForm.newRating}
          setRating={addForm.setNewRating}
          hoverRating={addForm.hoverRating}
          setHoverRating={addForm.setHoverRating}
          comment={addForm.newComment}
          setComment={addForm.setNewComment}
          images={addForm.newImages}
          setImages={addForm.setNewImages}
          error={addForm.addError}
        />
        <Button
          onClick={addForm.handleAdd}
          disabled={addForm.newRating === 0 || !addForm.newName.trim() || addForm.isAdding}
          className="w-full"
        >
          {addForm.isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Нэмэх
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function EditReviewDialog({ state }: { state: ReturnType<typeof useProductReviews> }) {
  const { editingReview, setEditingReview, editForm } = state;
  return (
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
        <ReviewFormFields
          name={editForm.editName}
          setName={editForm.setEditName}
          date={editForm.editDate}
          setDate={editForm.setEditDate}
          rating={editForm.editRating}
          setRating={editForm.setEditRating}
          hoverRating={editForm.editHoverRating}
          setHoverRating={editForm.setEditHoverRating}
          comment={editForm.editComment}
          setComment={editForm.setEditComment}
          images={editForm.editImages}
          setImages={editForm.setEditImages}
          error={editForm.editError}
        />
        <Button
          onClick={editForm.handleEdit}
          disabled={editForm.editRating === 0 || !editForm.editName.trim() || editForm.isEditing}
          className="w-full"
        >
          {editForm.isEditing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Хадгалах
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function ProductReviewsTab({ productId }: ProductReviewsTabProps) {
  const state = useProductReviews(productId);
  const { reviews, isLoading, openEdit, toggleStatus, isToggling, deleteReview } = state;

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
        <p className="text-sm text-muted-foreground">Нийт {reviews.length} сэтгэгдэл</p>
        <AddReviewDialog state={state} />
      </div>

      <EditReviewDialog state={state} />

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
            <ReviewListItem
              key={review.id}
              review={review}
              onEdit={openEdit}
              onToggleStatus={toggleStatus}
              onDelete={deleteReview}
              isToggleDisabled={isToggling}
            />
          ))}
        </div>
      )}
    </div>
  );
}
