"use client";

import { useState, useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImages } from "@/lib/image-compression";
import { log } from "@/lib/observability/log";

async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json();
  return data.urls;
}

interface BranchImageUploadCardProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  disabled?: boolean;
}

export function BranchImageUploadCard({
  imageUrl,
  setImageUrl,
  disabled,
}: BranchImageUploadCardProps) {
  const [loadingState, setLoadingState] = useState<
    "compressing" | "uploading" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const processFile = async (file: File) => {
    try {
      setLoadingState("compressing");
      const compressed = await compressImages([file]);
      setLoadingState("uploading");
      const urls = await uploadFiles(compressed);
      if (urls.length > 0) {
        setImageUrl(urls[0]);
      }
    } catch (err) {
      log.error("branch_image_upload_failed", err);
    } finally {
      setLoadingState(null);
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    await processFile(fileList[0]);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || loadingState) return;

    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) await processFile(file);
  };

  const onRemove = () => {
    setImageUrl("");
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Салбарын зураг</h3>

        {/* Upload button or current image */}
        <div className="aspect-[380/295] w-full">
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="peer sr-only"
            onChange={handleFilesChange}
            disabled={disabled || !!loadingState}
          />

          {imageUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative w-full h-full rounded-lg border overflow-hidden bg-muted group transition-colors",
                isDragging && "border-primary border-2 bg-primary/10",
              )}
            >
              <img
                src={imageUrl}
                alt="Branch image"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <label
                htmlFor={inputId}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <span className="text-white text-sm">Солих</span>
              </label>
            </div>
          ) : (
            <label
              htmlFor={inputId}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer h-full",
                isDragging && "border-primary bg-primary/10",
                (disabled || loadingState) &&
                  "cursor-not-allowed opacity-50 pointer-events-none"
              )}
            >
              {loadingState ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    {loadingState === "compressing"
                      ? "Шахаж байна..."
                      : "Байршуулж байна..."}
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    {isDragging ? "Зургаа тавина уу" : "Зураг нэмэх"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Чирж оруулах эсвэл дарж сонгох
                  </span>
                </>
              )}
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
