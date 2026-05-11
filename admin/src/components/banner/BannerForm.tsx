"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Pipette, Save, Upload, X } from "lucide-react";
import { useBannerEdit } from "@/hooks/useBannerEdit";
import { useState, useId, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-compression";

type LinkType = "none" | "category" | "product" | "link";

interface BannerFormProps {
  id?: string;
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json();
  return data.urls[0];
}

export function BannerForm({ id }: BannerFormProps) {
  const {
    formData,
    categories,
    products,
    isLoading,
    isSaving,
    error,
    isEditMode,
    updateFormData,
    handleSave,
  } = useBannerEdit(id);

  const [desktopLoadingState, setDesktopLoadingState] = useState<"compressing" | "uploading" | null>(null);
  const [mobileLoadingState, setMobileLoadingState] = useState<"compressing" | "uploading" | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>("none");
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [isPickingMobileColor, setIsPickingMobileColor] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
  const desktopInputId = useId();
  const mobileInputId = useId();

  // Load desktop image to canvas for color picking
  useEffect(() => {
    if (formData.image_url && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = formData.image_url;
    }
  }, [formData.image_url]);

  // Load mobile image to canvas for color picking
  useEffect(() => {
    if (formData.mobile_image_url && mobileCanvasRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = mobileCanvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = formData.mobile_image_url;
    }
  }, [formData.mobile_image_url]);

  const handleColorPick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPickingColor || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;

    updateFormData({ background_color: hex });
    setIsPickingColor(false);
  }, [isPickingColor, updateFormData]);

  const handleMobileColorPick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPickingMobileColor || !mobileCanvasRef.current) return;

    const canvas = mobileCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;

    updateFormData({ mobile_background_color: hex });
    setIsPickingMobileColor(false);
  }, [isPickingMobileColor, updateFormData]);

  // Sync linkType when formData loads (for editing existing banner)
  useEffect(() => {
    if (formData.category_id) {
      setLinkType("category");
    } else if (formData.product_id) {
      setLinkType("product");
    } else if (formData.link_url) {
      setLinkType("link");
    }
  }, [formData.category_id, formData.product_id, formData.link_url]);

  const handleLinkTypeChange = (type: LinkType) => {
    setLinkType(type);
    if (type === "none") {
      updateFormData({ category_id: null, product_id: null, link_url: null });
    } else if (type === "category") {
      updateFormData({ product_id: null, link_url: null });
      setCategoryOpen(true);
    } else if (type === "product") {
      updateFormData({ category_id: null, link_url: null });
      setProductOpen(true);
    } else if (type === "link") {
      updateFormData({ category_id: null, product_id: null });
    }
  };

  const selectedCategory = categories.find((c) => c.id === formData.category_id);
  const selectedProduct = products.find((p) => p.id === formData.product_id);

  const handleDesktopFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setDesktopLoadingState("compressing");
      const compressed = await compressImage(file);
      setDesktopLoadingState("uploading");
      const url = await uploadFile(compressed);
      updateFormData({ image_url: url });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setDesktopLoadingState(null);
      e.target.value = "";
    }
  };

  const handleMobileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMobileLoadingState("compressing");
      const compressed = await compressImage(file);
      setMobileLoadingState("uploading");
      const url = await uploadFile(compressed);
      updateFormData({ mobile_image_url: url });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setMobileLoadingState(null);
      e.target.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/banners">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Баннер засах" : "Шинэ баннер"}
        </h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Hidden canvases for color picking */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={mobileCanvasRef} className="hidden" />

      {/* Form Card */}
      <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-6 max-w-2xl">
        {/* Desktop Banner Image */}
        <div className="space-y-2">
          <Label>Desktop зураг</Label>
          <p className="text-xs text-muted-foreground">Компьютер дээр харагдах зураг (1900x410px)</p>
          <input
            id={desktopInputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="peer sr-only"
            onChange={handleDesktopFileChange}
            disabled={!!desktopLoadingState}
          />
          {formData.image_url ? (
            <div className="relative rounded-lg border overflow-hidden bg-muted max-h-48 flex items-center justify-center">
              <img
                src={formData.image_url}
                alt="Desktop banner preview"
                className={cn(
                  "max-w-full max-h-48 object-contain",
                  isPickingColor && "cursor-crosshair"
                )}
                onClick={handleColorPick}
              />
              <button
                type="button"
                onClick={() => updateFormData({ image_url: "", background_color: "#ffffff" })}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={desktopInputId}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer",
                desktopLoadingState && "cursor-not-allowed opacity-50 pointer-events-none"
              )}
            >
              {desktopLoadingState ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    {desktopLoadingState === "compressing" ? "Шахаж байна..." : "Байршуулж байна..."}
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Desktop зургаа энд дарж эсвэл зөөж оруулна уу.
                  </p>
                </>
              )}
            </label>
          )}
        </div>

        {/* Mobile Banner Image */}
        <div className="space-y-2">
          <Label>Mobile зураг</Label>
          <p className="text-xs text-muted-foreground">Гар утсан дээр харагдах зураг (заавал биш)</p>
          <input
            id={mobileInputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="peer sr-only"
            onChange={handleMobileFileChange}
            disabled={!!mobileLoadingState}
          />
          {formData.mobile_image_url ? (
            <div className="relative rounded-lg border overflow-hidden bg-muted max-h-48 flex items-center justify-center">
              <img
                src={formData.mobile_image_url}
                alt="Mobile banner preview"
                className={cn(
                  "max-w-full max-h-48 object-contain",
                  isPickingMobileColor && "cursor-crosshair"
                )}
                onClick={handleMobileColorPick}
              />
              <button
                type="button"
                onClick={() => updateFormData({ mobile_image_url: null, mobile_background_color: null })}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={mobileInputId}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer",
                mobileLoadingState && "cursor-not-allowed opacity-50 pointer-events-none"
              )}
            >
              {mobileLoadingState ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    {mobileLoadingState === "compressing" ? "Шахаж байна..." : "Байршуулж байна..."}
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Mobile зургаа энд дарж оруулна уу.
                  </p>
                </>
              )}
            </label>
          )}
        </div>

        {/* Desktop Background Color Picker */}
        <div className="space-y-2">
          <Label>Desktop дэвсгэр өнгө</Label>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 shadow-sm"
              style={{ backgroundColor: formData.background_color }}
            />
            <Input
              value={formData.background_color}
              onChange={(e) => updateFormData({ background_color: e.target.value })}
              placeholder="#ffffff"
              className="w-28 sm:w-32 font-mono"
            />
            <input
              type="color"
              value={formData.background_color}
              onChange={(e) => updateFormData({ background_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
            {formData.image_url && (
              <Button
                type="button"
                variant={isPickingColor ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPickingColor(!isPickingColor)}
                className="gap-2"
              >
                <Pipette className="h-4 w-4" />
                <span className="hidden sm:inline">{isPickingColor ? "Зураг дээрээс сонгоно уу" : "Зургаас сонгох"}</span>
                <span className="sm:hidden">{isPickingColor ? "Сонгоно уу" : "Зургаас"}</span>
              </Button>
            )}
          </div>
          {isPickingColor && (
            <p className="text-sm text-muted-foreground">
              Зураг дээр дарж өнгө сонгоно уу
            </p>
          )}
        </div>

        {/* Mobile Background Color Picker */}
        <div className="space-y-2">
          <Label>Mobile дэвсгэр өнгө</Label>
          <p className="text-xs text-muted-foreground">Гар утсан дээр харагдах өнгө (заавал биш)</p>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 shadow-sm"
              style={{ backgroundColor: formData.mobile_background_color || "#ffffff" }}
            />
            <Input
              value={formData.mobile_background_color || ""}
              onChange={(e) => updateFormData({ mobile_background_color: e.target.value || null })}
              placeholder="#ffffff"
              className="w-28 sm:w-32 font-mono"
            />
            <input
              type="color"
              value={formData.mobile_background_color || "#ffffff"}
              onChange={(e) => updateFormData({ mobile_background_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
            {formData.mobile_image_url && (
              <Button
                type="button"
                variant={isPickingMobileColor ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPickingMobileColor(!isPickingMobileColor)}
                className="gap-2"
              >
                <Pipette className="h-4 w-4" />
                {isPickingMobileColor ? "Сонгоно уу" : "Зургаас"}
              </Button>
            )}
            {formData.mobile_background_color && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateFormData({ mobile_background_color: null })}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Арилгах
              </Button>
            )}
          </div>
          {isPickingMobileColor && (
            <p className="text-sm text-muted-foreground">
              Mobile зураг дээр дарж өнгө сонгоно уу
            </p>
          )}
        </div>

        {/* Link Target - Category or Product (mutually exclusive) */}
        <div className="space-y-3">
          <Label>Холбох</Label>

          {/* Link Type Toggle */}
          <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => handleLinkTypeChange("none")}
              className={cn(
                "px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                linkType === "none"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Байхгүй
            </button>
            <button
              type="button"
              onClick={() => handleLinkTypeChange("category")}
              className={cn(
                "px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                linkType === "category"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ангилал
            </button>
            <button
              type="button"
              onClick={() => handleLinkTypeChange("product")}
              className={cn(
                "px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                linkType === "product"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Бүтээгдэхүүн
            </button>
            <button
              type="button"
              onClick={() => handleLinkTypeChange("link")}
              className={cn(
                "px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                linkType === "link"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Холбоос
            </button>
          </div>

          {/* Category Combobox */}
          {linkType === "category" && (
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedCategory?.name ?? "Ангилал сонгох..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Ангилал хайх..." />
                  <CommandList>
                    <CommandEmpty>Ангилал олдсонгүй.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.name}
                          onSelect={() => {
                            updateFormData({ category_id: cat.id, product_id: null, link_url: null });
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.category_id === cat.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* Product Combobox */}
          {linkType === "product" && (
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedProduct?.name ?? "Бүтээгдэхүүн сонгох..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Бүтээгдэхүүн хайх..." />
                  <CommandList>
                    <CommandEmpty>Бүтээгдэхүүн олдсонгүй.</CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            updateFormData({ product_id: p.id, category_id: null, link_url: null });
                            setProductOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.product_id === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* Custom URL Input */}
          {linkType === "link" && (
            <Input
              value={formData.link_url ?? ""}
              onChange={(e) => updateFormData({ link_url: e.target.value || null })}
              placeholder="https://example.com/page"
              type="url"
            />
          )}

          <p className="text-sm text-muted-foreground">
            Баннер дарахад сонгосон хуудас руу шилжинэ
          </p>
        </div>

        {/* Banner Type */}
        <div className="space-y-2">
          <Label>Баннерын төрөл</Label>
          <div className="grid grid-cols-2 rounded-lg border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => updateFormData({ type: "carousel" })}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                formData.type === "carousel"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Carousel (Слайдер)
            </button>
            <button
              type="button"
              onClick={() => updateFormData({ type: "promo" })}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                formData.type === "promo"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Promo (Хуудас дотор)
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {formData.type === "carousel"
              ? "Нүүр хуудасны дээд хэсгийн слайдерт харагдана"
              : "Нүүр хуудасны дунд хэсэгт тусдаа харагдана"}
          </p>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sort_order">Эрэмбэ</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) =>
              updateFormData({ sort_order: parseInt(e.target.value) || 0 })
            }
            placeholder="0"
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label htmlFor="is_active">Идэвхтэй</Label>
            <p className="text-sm text-muted-foreground">
              Баннерийг харуулах эсэх
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => updateFormData({ is_active: checked })}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Хадгалах
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
