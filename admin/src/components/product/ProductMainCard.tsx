"use client";

import { useState, useId, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { log } from "@/lib/observability/log";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Trash2,
  Plus,
  GripVertical,
  Loader2,
  X,
  Upload,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { compressImages } from "@/lib/image-compression";
import type { Brand, VariantForm, GeneratedVariant } from "./types";
import { VARIANT_DETAIL_TYPES } from "./types";
import type { ProductDetail } from "@/hooks/useProductEdit";

// Format number with comma separators (e.g., 1000000 -> 1,000,000)
function formatPrice(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const numStr = String(value).replace(/[^0-9]/g, "");
  if (numStr === "") return "";
  return Number(numStr).toLocaleString("en-US");
}

// Parse formatted price back to raw number string (e.g., 1,000,000 -> 1000000)
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

interface ProductMainCardProps {
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  brandId: string | null;
  setBrandId: (value: string | null) => void;
  originalUrl: string;
  setOriginalUrl: (value: string) => void;
  brands: Brand[];
  variants: VariantForm[];
  updateVariant: (id: string, field: keyof VariantForm, value: string) => void;
  productDetails: ProductDetail[];
  addProductDetail: () => void;
  removeProductDetail: (detailId: string) => void;
  updateProductDetail: (
    detailId: string,
    field: "type" | "content",
    value: string,
  ) => void;
  reorderProductDetails: (fromIndex: number, toIndex: number) => void;
  richDescription: string;
  setRichDescription: (value: string) => void;
  richImages: string[];
  setRichImages: (images: string[]) => void;
  generatedVariants?: GeneratedVariant[];
}

interface BrandComboboxProps {
  brands: Brand[];
  value: string | null;
  onChange: (value: string | null) => void;
}

function BrandCombobox({ brands, value, onChange }: BrandComboboxProps) {
  const [open, setOpen] = useState(false);

  // Sort brands A-Z
  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name, "mn")),
    [brands],
  );

  const selectedBrand = brands.find((b) => b.id === value);

  return (
    <div className="space-y-2">
      <Label>Брэнд</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedBrand ? selectedBrand.name : "Сонгох"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Брэнд хайх..." />
            <CommandList>
              <CommandEmpty>Брэнд олдсонгүй</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === null ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Сонгох
                </CommandItem>
                {sortedBrands.map((brand) => (
                  <CommandItem
                    key={brand.id}
                    value={brand.name}
                    onSelect={() => {
                      onChange(brand.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === brand.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {brand.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ProductMainCard({
  name,
  setName,
  description,
  setDescription,
  brandId,
  setBrandId,
  originalUrl,
  setOriginalUrl,
  brands,
  variants,
  updateVariant,
  productDetails,
  addProductDetail,
  removeProductDetail,
  updateProductDetail,
  reorderProductDetails,
  richDescription,
  setRichDescription,
  richImages,
  setRichImages,
  generatedVariants,
}: ProductMainCardProps) {
  const hasMultipleOptions = generatedVariants && generatedVariants.length > 0;
  const variantStockSum = hasMultipleOptions
    ? generatedVariants.reduce((sum, v) => sum + (parseInt(v.stockQuantity) || 0), 0)
    : 0;
  const detailSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDetailDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = productDetails.findIndex((d) => d.id === active.id);
    const newIndex = productDetails.findIndex((d) => d.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderProductDetails(oldIndex, newIndex);
    }
  };

  if (!variants.length) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-8">
          {/* Title */}
          <h2 className="text-xl font-semibold">Бүтээгдэхүүний мэдээлэл</h2>

          {/* Form fields */}
          <div className="space-y-5">
            {/* Row 1: Name + Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Нэр</Label>
                <Input
                  placeholder="Бүтээгдэхүүний нэрээ оруулна уу"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <BrandCombobox
                brands={brands}
                value={brandId}
                onChange={setBrandId}
              />
            </div>

            {/* Row 2: Price + Discount Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Үнэ</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Бүтээгдэхүүний үнэ"
                  value={formatPrice(variants[0]?.price ?? "")}
                  onChange={(e) =>
                    updateVariant(
                      variants[0].id,
                      "price",
                      parsePrice(e.target.value),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Хямдарсан үнэ</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Хямдарсан үнэ"
                  value={formatPrice(variants[0]?.discountPrice ?? "")}
                  onChange={(e) =>
                    updateVariant(
                      variants[0].id,
                      "discountPrice",
                      parsePrice(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            {/* Row 3: Quantity + SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Тоо ширхэг</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Тоо ширхэг"
                  value={hasMultipleOptions ? variantStockSum.toString() : (variants[0]?.stockQuantity ?? "")}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    updateVariant(variants[0].id, "stockQuantity", val);
                  }}
                  disabled={hasMultipleOptions}
                />
                {hasMultipleOptions && (
                  <p className="text-xs text-muted-foreground">
                    Сонголтуудын нийлбэр тоо ширхэг (сонголт таб дээрээс удирдана)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Код (SKU)</Label>
                <Input
                  placeholder="Бүтээгдэхүүний код оруулна уу"
                  value={variants[0]?.sku ?? ""}
                  onChange={(e) =>
                    updateVariant(variants[0].id, "sku", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Row 4: Original URL */}
            <div className="space-y-2">
              <Label>Эх линк</Label>
              <Input
                type="url"
                placeholder="https://example.com/product"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
            </div>

            {/* Short description */}
            <div className="space-y-2">
              <Label>Богино тайлбар</Label>
              <Textarea
                placeholder="Богино тайлбар оруулна уу"
                className="min-h-[100px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Detailed description - Rich text area */}
          <RichDescriptionEditor
            value={richDescription}
            onChange={setRichDescription}
            images={richImages}
            onImagesChange={setRichImages}
          />

          {/* Variant Details Table */}
          <div className="space-y-3">
            <Label className="text-base">Нэмэлт мэдээлэл</Label>
            <div className="border rounded-md overflow-x-auto">
              {/* Table header */}
              <div className="flex border-b bg-muted/30">
                <div className="w-11 shrink-0 flex items-center justify-center py-3">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="w-12 shrink-0 flex items-center justify-center py-3">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="w-[200px] shrink-0 px-2 py-3 text-sm text-muted-foreground">
                  Гарчиг
                </div>
                <div className="flex-1 px-2 py-3 text-sm text-muted-foreground">
                  Тайлбар
                </div>
              </div>

              {/* Table rows */}
              <DndContext
                sensors={detailSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDetailDragEnd}
              >
                <SortableContext
                  items={productDetails.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {productDetails.map((detail) => (
                    <SortableDetailRow
                      key={detail.id}
                      detail={detail}
                      onRemove={removeProductDetail}
                      onUpdate={updateProductDetail}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add row button */}
              <button
                type="button"
                onClick={addProductDetail}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-muted-foreground hover:bg-muted/30 transition-colors border-t"
              >
                <Plus className="h-4 w-4" />
                Шинэ мөр нэмэх
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function SortableDetailRow({
  detail,
  onRemove,
  onUpdate,
}: {
  detail: ProductDetail;
  onRemove: (detailId: string) => void;
  onUpdate: (
    detailId: string,
    field: "type" | "content",
    value: string,
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: detail.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex border-b last:border-b-0 group bg-background",
        isDragging && "opacity-50 shadow-lg z-10 relative",
      )}
    >
      {/* Drag handle */}
      <div
        className="w-11 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Delete */}
      <div className="w-12 shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(detail.id)}
          className="p-1.5 rounded hover:bg-muted transition-colors"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Type */}
      <div className="w-[200px] shrink-0 px-2 py-3">
        <Select
          value={detail.type || "placeholder"}
          onValueChange={(val) =>
            onUpdate(detail.id, "type", val === "placeholder" ? "" : val)
          }
        >
          <SelectTrigger className="border-0 shadow-none h-auto p-0 text-sm font-medium">
            <SelectValue placeholder="Сонгох" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="placeholder" disabled>
              Сонгох
            </SelectItem>
            {VARIANT_DETAIL_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="flex-1 px-2 py-3">
        <textarea
          className="w-full text-sm resize-none bg-transparent outline-none min-h-[20px]"
          placeholder="Тайлбар бичих..."
          rows={Math.max(1, Math.ceil(detail.content.length / 60))}
          value={detail.content}
          onChange={(e) => onUpdate(detail.id, "content", e.target.value)}
        />
      </div>
    </div>
  );
}

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

function RichDescriptionEditor({
  value,
  onChange,
  images,
  onImagesChange,
}: RichDescriptionEditorProps) {
  const [loadingState, setLoadingState] = useState<
    "compressing" | "uploading" | null
  >(null);
  const imageInputId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      setLoadingState("compressing");
      const compressed = await compressImages(Array.from(fileList));
      setLoadingState("uploading");
      const urls = await uploadFiles(compressed);
      onImagesChange([...images, ...urls]);
    } catch (err) {
      log.error("product_main_image_upload_failed", err);
    } finally {
      setLoadingState(null);
      e.target.value = "";
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;

    e.preventDefault();
    try {
      setLoadingState("compressing");
      const compressed = await compressImages(files);
      setLoadingState("uploading");
      const urls = await uploadFiles(compressed);
      onImagesChange([...images, ...urls]);
    } catch (err) {
      log.error("product_main_paste_upload_failed", err);
    } finally {
      setLoadingState(null);
    }
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

      {/* Image upload area */}
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

        {/* Sortable images grid */}
        {images.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {images.map((url, index) => (
                  <SortableImageItem
                    key={url}
                    url={url}
                    index={index}
                    onRemove={removeImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Upload button */}
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
                {loadingState === "compressing"
                  ? "Шахаж байна..."
                  : "Байршуулж байна..."}
              </span>
            </div>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Зураг оруулах эсвэл paste хийх
              </span>
            </>
          )}
        </label>

        {images.length > 1 && (
          <p className="text-xs text-muted-foreground">
            Дарааллыг өөрчлөхийн тулд зургийг чирнэ үү
          </p>
        )}
      </div>

      {/* Textarea */}
      <Textarea
        placeholder="Зургийг paste хийж оруулна уу"
        className="min-h-[160px] resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface SortableImageItemProps {
  url: string;
  index: number;
  onRemove: (url: string) => void;
}

function SortableImageItem({ url, index, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

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
      <img
        src={url}
        alt={`Image ${index + 1}`}
        className="h-full w-full object-cover"
      />
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 h-6 w-6 flex items-center justify-center rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </div>
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
      {/* Index badge */}
      <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
        {index + 1}
      </span>
    </div>
  );
}
