"use client";

import { ImageIcon, Loader2 } from "lucide-react";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { compressImages } from "@/lib/image-compression";
import { log } from "@/lib/observability/log";
import { cn } from "@/lib/utils";

import type { GeneratedVariant } from "./types";

function formatPrice(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const numStr = String(value).replace(/[^0-9]/g, "");
  if (numStr === "") return "";
  return Number(numStr).toLocaleString("en-US");
}

function parsePrice(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

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

type UpdateVariantFn = (variantId: string, field: keyof GeneratedVariant, value: string) => void;

interface VariantsTableProps {
  variants: GeneratedVariant[];
  updateVariant: UpdateVariantFn;
}

export function VariantsTable({ variants, updateVariant }: VariantsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[minmax(150px,1fr)_150px_150px_100px_120px_130px_60px] gap-2 bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div>Төрөл</div>
        <div>Үнэ</div>
        <div>Хямдарсан үнэ</div>
        <div>Тоо ширхэг</div>
        <div>Код (SKU)</div>
        <div>Төлөв</div>
        <div>Зураг</div>
      </div>
      <div className="divide-y">
        {variants.map((variant) => (
          <VariantRow key={variant.id} variant={variant} updateVariant={updateVariant} />
        ))}
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  updateVariant,
}: {
  variant: GeneratedVariant;
  updateVariant: UpdateVariantFn;
}) {
  return (
    <div className="grid grid-cols-[minmax(150px,1fr)_150px_150px_100px_120px_130px_60px] gap-2 px-4 py-3 items-center">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 shrink-0 rounded-full bg-green-500" />
        <span className="text-sm font-medium">{variant.combination}</span>
      </div>
      <PriceCell variant={variant} field="price" updateVariant={updateVariant} />
      <PriceCell variant={variant} field="discountPrice" updateVariant={updateVariant} />
      <StockCell variant={variant} updateVariant={updateVariant} />
      <SkuCell variant={variant} updateVariant={updateVariant} />
      <StatusCell variant={variant} updateVariant={updateVariant} />
      <ImageCell variant={variant} updateVariant={updateVariant} />
    </div>
  );
}

function PriceCell({
  variant,
  field,
  updateVariant,
}: {
  variant: GeneratedVariant;
  field: "price" | "discountPrice";
  updateVariant: UpdateVariantFn;
}) {
  return (
    <div>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={field === "price" ? "Үнэ" : "Хямдарсан үнэ"}
        value={formatPrice(variant[field])}
        onChange={(e) => updateVariant(variant.id, field, parsePrice(e.target.value))}
        className="h-9"
      />
    </div>
  );
}

function StockCell({
  variant,
  updateVariant,
}: {
  variant: GeneratedVariant;
  updateVariant: UpdateVariantFn;
}) {
  return (
    <div>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={variant.stockQuantity}
        onChange={(e) =>
          updateVariant(variant.id, "stockQuantity", e.target.value.replace(/[^0-9]/g, ""))
        }
        className="h-9"
      />
    </div>
  );
}

function SkuCell({
  variant,
  updateVariant,
}: {
  variant: GeneratedVariant;
  updateVariant: UpdateVariantFn;
}) {
  return (
    <div>
      <Input
        placeholder="SKU"
        value={variant.sku}
        onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
        className="h-9"
      />
    </div>
  );
}

function StatusCell({
  variant,
  updateVariant,
}: {
  variant: GeneratedVariant;
  updateVariant: UpdateVariantFn;
}) {
  return (
    <div>
      <Select
        value={variant.status}
        onValueChange={(value) => updateVariant(variant.id, "status", value)}
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Идэвхтэй</SelectItem>
          <SelectItem value="inactive">Идэвхгүй</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function ImageCell({
  variant,
  updateVariant,
}: {
  variant: GeneratedVariant;
  updateVariant: UpdateVariantFn;
}) {
  const fileInputId = useId();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      setUploadingImage(true);
      const compressed = await compressImages(files);
      const urls = await uploadFiles(compressed);
      if (urls.length > 0) {
        updateVariant(variant.id, "imageUrl", urls[0]);
      }
    } catch (err) {
      log.error("option_image_upload_failed", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    await processFiles(Array.from(fileList));
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
    if (uploadingImage) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    await processFiles(files);
  };

  return (
    <div className="flex justify-center">
      <input
        id={fileInputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleImageUpload}
        disabled={uploadingImage}
      />
      <label
        htmlFor={fileInputId}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-10 h-10 border rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden",
          uploadingImage && "opacity-50 cursor-not-allowed",
          isDragging && "border-primary border-2 bg-primary/10",
        )}
      >
        {uploadingImage ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : variant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={variant.imageUrl}
            alt={variant.combination}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </label>
    </div>
  );
}
