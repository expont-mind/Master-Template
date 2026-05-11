"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, X } from "lucide-react";
import { translateServerError } from "@/lib/utils/error-messages";

export type CategoryDialogMode = "new" | "sub" | "edit";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CategoryDialogMode;
  initialName?: string;
  initialImage?: string;
  initialFeatured?: boolean;
  initialStatus?: boolean;
  onSave: (data: {
    name: string;
    image: string;
    is_featured: boolean;
    is_active: boolean;
  }) => Promise<void>;
}

const TITLES: Record<CategoryDialogMode, string> = {
  new: "Шинэ ангилал нэмэх",
  sub: "Дэд ангилал нэмэх",
  edit: "Ангилал шинэчлэх",
};

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  initialName = "",
  initialImage = "",
  initialFeatured = false,
  initialStatus = true,
  onSave,
}: CategoryDialogProps) {
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [isActive, setIsActive] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setImage(initialImage);
      setIsFeatured(initialFeatured);
      setIsActive(initialStatus);
      setError(null);
    }
  }, [open, initialName, initialImage, initialFeatured, initialStatus]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Ангиллын нэрийг заавал оруулна уу.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        image,
        is_featured: isFeatured,
        is_active: isActive,
      });
      onOpenChange(false);
    } catch (err) {
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "Ангилал хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className="sm:max-w-[375px] p-6 gap-6 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogDescription className="sr-only">
          {TITLES[mode]}
        </DialogDescription>
        {/* Header */}
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold leading-7">
            {TITLES[mode]}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center h-8 w-8 rounded-sm hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-[22px] pb-1.5">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name input */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Ангиллын нэр</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ангиллын нэр оруулна"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Зураг/icon оруулах</Label>
            <ImageUpload
              value={image}
              onChange={setImage}
              onRemove={() => setImage("")}
              aspectRatio="video"
            />
          </div>

          {/* Switches */}
          <div className="flex items-center gap-2">
            <Switch
              id="category-featured"
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
            <Label
              htmlFor="category-featured"
              className="text-sm font-medium cursor-pointer"
            >
              Онцлох
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <Switch
              id="category-status"
              checked={isActive}
              onCheckedChange={setIsActive}
            />

            <Label
              htmlFor="category-status"
              className="text-sm font-medium cursor-pointer"
            >
              Хэрэглэгчдэд харуулах
            </Label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded"
          >
            Буцах
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Хадгалах
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
