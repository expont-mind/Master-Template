"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { CONTENT_STATUS_LABELS } from "@/constants";
import { usePointFaqEdit } from "@/hooks/usePointFaqEdit";
import type { ContentStatus } from "@/types/database";

interface PointFaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: string | null;
}

export function PointFaqDialog({ open, onOpenChange, editId }: PointFaqDialogProps) {
  const {
    isNew,
    isLoading,
    isSaving,
    error,
    question,
    setQuestion,
    answer,
    setAnswer,
    sortOrder,
    setSortOrder,
    status,
    setStatus,
    handleSave,
    reset,
  } = usePointFaqEdit(editId);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Шинэ асуулт нэмэх" : "Асуулт засах"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Асуулт</Label>
              <Input
                id="faq-question"
                placeholder="Асуулт оруулна уу..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-answer">Хариулт</Label>
              <Textarea
                id="faq-answer"
                placeholder="Хариулт оруулна уу..."
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faq-sort-order">Эрэмбэ</Label>
                <Input
                  id="faq-sort-order"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Төлөв</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTENT_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Болих
          </Button>
          <Button onClick={onSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Хадгалах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
