"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Upload, X } from "lucide-react";
import { useId, useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImages } from "@/lib/image-compression";
import { log } from "@/lib/observability/log";

import { uploadFiles } from "./_productMainHelpers";

interface SortableImageItemProps {
  url: string;
  index: number;
  onRemove: (url: string) => void;
}

function SortableImageItem({ url, index, onRemove }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-md border overflow-hidden bg-muted group ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Image ${index + 1}`} className="h-full w-full object-cover" />
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 h-6 w-6 flex items-center justify-center rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </div>
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
      <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
        {index + 1}
      </span>
    </div>
  );
}

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function RichDescriptionEditor({
  value,
  onChange,
  images,
  onImagesChange,
}: RichDescriptionEditorProps) {
  const [loadingState, setLoadingState] = useState<"compressing" | "uploading" | null>(null);
  const imageInputId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const processAndAppendImages = async (files: File[], logKey: string) => {
    try {
      setLoadingState("compressing");
      const compressed = await compressImages(files);
      setLoadingState("uploading");
      const urls = await uploadFiles(compressed);
      onImagesChange([...images, ...urls]);
    } catch (err) {
      log.error(logKey, err);
    } finally {
      setLoadingState(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    await processAndAppendImages(Array.from(fileList), "product_main_image_upload_failed");
    e.target.value = "";
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    e.preventDefault();
    await processAndAppendImages(files, "product_main_paste_upload_failed");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const removeImage = (urlToRemove: string) => {
    onImagesChange(images.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      <Label className="text-base">Дэлгэрэнгүй тайлбар</Label>

      <div className="space-y-3">
        <input
          id={imageInputId}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={handleImageUpload}
          disabled={!!loadingState}
        />

        {images.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {images.map((url, index) => (
                  <SortableImageItem key={url} url={url} index={index} onRemove={removeImage} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <label
          htmlFor={imageInputId}
          className={`flex items-center justify-center gap-2 h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary hover:bg-muted/50 ${
            loadingState ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loadingState ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {loadingState === "compressing" ? "Шахаж байна..." : "Байршуулж байна..."}
              </span>
            </div>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Зураг оруулах эсвэл paste хийх</span>
            </>
          )}
        </label>

        {images.length > 1 && (
          <p className="text-xs text-muted-foreground">
            Дарааллыг өөрчлөхийн тулд зургийг чирнэ үү
          </p>
        )}
      </div>

      <Textarea
        placeholder="Зургийг paste хийж оруулна уу"
        className="min-h-[160px] resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
