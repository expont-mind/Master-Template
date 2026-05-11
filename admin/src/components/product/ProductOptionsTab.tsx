"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OptionGroup, GeneratedVariant } from "./types";
import { OPTION_TYPES } from "./types";
import { compressImages } from "@/lib/image-compression";
import { useCustomOptionTypes } from "@/hooks/useCustomOptionTypes";

// Generate random SKU
function generateSku(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SKU-${timestamp}${random}`;
}

// Format number with comma separators
function formatPrice(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const numStr = String(value).replace(/[^0-9]/g, "");
  if (numStr === "") return "";
  return Number(numStr).toLocaleString("en-US");
}

// Parse formatted price back to raw number string
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

interface ProductOptionsTabProps {
  optionGroups: OptionGroup[];
  setOptionGroups: (groups: OptionGroup[]) => void;
  generatedVariants: GeneratedVariant[];
  setGeneratedVariants: (variants: GeneratedVariant[]) => void;
  basePrice: string;
}

export function ProductOptionsTab({
  optionGroups,
  setOptionGroups,
  generatedVariants,
  setGeneratedVariants,
  basePrice,
}: ProductOptionsTabProps) {
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>(
    {},
  );
  const { customTypes, addCustomType } = useCustomOptionTypes();

  // Generate cartesian product of all option values
  // Required groups form the base variants, optional group values are appended as additional variants
  const generateVariantCombinations = useCallback(
    (groups: OptionGroup[]): GeneratedVariant[] => {
      const requiredGroups = groups.filter(
        (g) => g.values.length > 0 && g.is_required !== false,
      );
      const optionalGroups = groups.filter(
        (g) => g.values.length > 0 && g.is_required === false,
      );
      if (requiredGroups.length === 0) return [];

      // Base combinations from required groups only
      const baseCombinations: string[][] = requiredGroups.reduce<string[][]>(
        (acc, group) => {
          if (acc.length === 0) {
            return group.values.map((v) => [v]);
          }
          return acc.flatMap((combo) => group.values.map((v) => [...combo, v]));
        },
        [],
      );

      const allCombinations: string[][] = [];

      if (optionalGroups.length === 0) {
        // No optional groups - just use base combinations
        allCombinations.push(...baseCombinations);
      } else {
        // Add base combinations (required only)
        allCombinations.push(...baseCombinations);

        // Generate power set of optional groups (excluding empty set)
        const optionalSubsets: OptionGroup[][] = [];
        for (let i = 1; i < 1 << optionalGroups.length; i++) {
          const subset: OptionGroup[] = [];
          for (let j = 0; j < optionalGroups.length; j++) {
            if (i & (1 << j)) subset.push(optionalGroups[j]);
          }
          optionalSubsets.push(subset);
        }

        // For each optional subset, extend base combinations
        for (const subset of optionalSubsets) {
          const optCombinations = subset.reduce<string[][]>(
            (acc, group) => {
              if (acc.length === 0) {
                return group.values.map((v) => [v]);
              }
              return acc.flatMap((combo) =>
                group.values.map((v) => [...combo, v]),
              );
            },
            [],
          );
          for (const base of baseCombinations) {
            for (const opt of optCombinations) {
              allCombinations.push([...base, ...opt]);
            }
          }
        }
      }

      return allCombinations.map((combo, index) => {
        const combinationStr = combo.join(" / ");
        // Check if variant already exists
        const existingVariant = generatedVariants.find(
          (v) => v.combination === combinationStr,
        );
        if (existingVariant) {
          return existingVariant;
        }
        return {
          id: `variant-${Date.now()}-${index}`,
          combination: combinationStr,
          optionValues: combo,
          price: basePrice || "",
          discountPrice: "",
          stockQuantity: "",
          sku: generateSku(),
          status: "active" as const,
          imageUrl: "",
        };
      });
    },
    [generatedVariants, basePrice],
  );

  // Add new option group
  const addOptionGroup = () => {
    const usedTypes = optionGroups.map((g) => g.type);
    const availableType =
      OPTION_TYPES.find((t) => !usedTypes.includes(t)) || "";

    const newGroup: OptionGroup = {
      id: `group-${Date.now()}`,
      type: availableType,
      values: [],
      is_required: true,
    };
    const newGroups = [...optionGroups, newGroup];
    setOptionGroups(newGroups);
  };

  // Remove option group
  const removeOptionGroup = (groupId: string) => {
    const newGroups = optionGroups.filter((g) => g.id !== groupId);
    setOptionGroups(newGroups);
    // Regenerate variants
    setGeneratedVariants(generateVariantCombinations(newGroups));
  };

  // Update option group type
  const updateGroupType = (groupId: string, type: string) => {
    const newGroups = optionGroups.map((g) =>
      g.id === groupId ? { ...g, type } : g,
    );
    setOptionGroups(newGroups);
  };

  // Update option group required flag
  const updateGroupRequired = (groupId: string, isRequired: boolean) => {
    const newGroups = optionGroups.map((g) =>
      g.id === groupId ? { ...g, is_required: isRequired } : g,
    );
    setOptionGroups(newGroups);
    setGeneratedVariants(generateVariantCombinations(newGroups));
  };

  // Add value to option group
  const addValueToGroup = (groupId: string, value: string) => {
    if (!value.trim()) return;

    const newGroups = optionGroups.map((g) =>
      g.id === groupId && !g.values.includes(value.trim())
        ? { ...g, values: [...g.values, value.trim()] }
        : g,
    );
    setOptionGroups(newGroups);
    setNewValueInputs((prev) => ({ ...prev, [groupId]: "" }));

    // Regenerate variants
    setGeneratedVariants(generateVariantCombinations(newGroups));
  };

  // Remove value from option group
  const removeValueFromGroup = (groupId: string, value: string) => {
    const newGroups = optionGroups.map((g) =>
      g.id === groupId
        ? { ...g, values: g.values.filter((v) => v !== value) }
        : g,
    );
    setOptionGroups(newGroups);

    // Regenerate variants
    setGeneratedVariants(generateVariantCombinations(newGroups));
  };

  // Update variant field
  const updateVariant = (
    variantId: string,
    field: keyof GeneratedVariant,
    value: string,
  ) => {
    setGeneratedVariants(
      generatedVariants.map((v) =>
        v.id === variantId ? { ...v, [field]: value } : v,
      ),
    );
  };

  // Handle key press for adding values
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    groupId: string,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValueToGroup(groupId, newValueInputs[groupId] || "");
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Option Groups */}
        <div className="space-y-4">
          {optionGroups.map((group, index) => (
            <OptionGroupCard
              key={group.id}
              group={group}
              index={index}
              onRemove={() => removeOptionGroup(group.id)}
              onTypeChange={(type) => updateGroupType(group.id, type)}
              onRequiredChange={(isRequired) =>
                updateGroupRequired(group.id, isRequired)
              }
              onAddValue={(value) => addValueToGroup(group.id, value)}
              onRemoveValue={(value) => removeValueFromGroup(group.id, value)}
              newValueInput={newValueInputs[group.id] || ""}
              onNewValueInputChange={(value) =>
                setNewValueInputs((prev) => ({ ...prev, [group.id]: value }))
              }
              onKeyPress={(e) => handleKeyPress(e, group.id)}
              usedTypes={optionGroups
                .filter((g) => g.id !== group.id)
                .map((g) => g.type)}
              customTypes={customTypes}
              onAddCustomType={addCustomType}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOptionGroup}
            className="text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Сонголт нэмэх
          </Button>
        </div>

        {/* Variants Table */}
        {generatedVariants.length > 0 && (
          <VariantsTable
            variants={generatedVariants}
            updateVariant={updateVariant}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface OptionGroupCardProps {
  group: OptionGroup;
  index: number;
  onRemove: () => void;
  onTypeChange: (type: string) => void;
  onRequiredChange: (isRequired: boolean) => void;
  onAddValue: (value: string) => void;
  onRemoveValue: (value: string) => void;
  newValueInput: string;
  onNewValueInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  usedTypes: string[];
  customTypes: string[];
  onAddCustomType: (type: string) => void;
}

function OptionGroupCard({
  group,
  index,
  onRemove,
  onTypeChange,
  onRequiredChange,
  onAddValue,
  onRemoveValue,
  newValueInput,
  onNewValueInputChange,
  onKeyPress,
  usedTypes,
  customTypes,
  onAddCustomType,
}: OptionGroupCardProps) {
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");

  const allTypes = [
    ...OPTION_TYPES,
    ...customTypes.filter((t) => !OPTION_TYPES.includes(t as any)),
  ];
  const isCustomType = group.type && !allTypes.includes(group.type);

  const handleSelectChange = (value: string) => {
    if (value === "__custom__") {
      setIsCustomInput(true);
      setCustomTypeName("");
      return;
    }
    onTypeChange(value);
  };

  const handleCustomSubmit = () => {
    const trimmed = customTypeName.trim();
    if (trimmed) {
      onTypeChange(trimmed);
      onAddCustomType(trimmed);
    }
    setIsCustomInput(false);
    setCustomTypeName("");
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomSubmit();
    } else if (e.key === "Escape") {
      setIsCustomInput(false);
      setCustomTypeName("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Сонголт {index + 1}
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={group.is_required}
              onClick={() => onRequiredChange(!group.is_required)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                group.is_required ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out",
                  group.is_required ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
            <span
              className={cn(
                "text-xs font-medium",
                group.is_required ? "text-primary" : "text-muted-foreground",
              )}
            >
              {group.is_required ? "Заавал" : "Заавал биш"}
            </span>
          </label>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRemove}
          className="h-8"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Устгах
        </Button>
      </div>

      <div className="flex gap-3">
        {/* Type Select / Custom Input */}
        <div className="w-[200px] h-10">
          {isCustomInput ? (
            <Input
              autoFocus
              placeholder="Нэр бичих..."
              value={customTypeName}
              onChange={(e) => setCustomTypeName(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              onBlur={handleCustomSubmit}
              className="h-10"
            />
          ) : (
            <Select value={group.type} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full min-h-10">
                <SelectValue placeholder="Сонгох" />
              </SelectTrigger>
              <SelectContent>
                {allTypes.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    disabled={usedTypes.includes(type)}
                  >
                    {type}
                  </SelectItem>
                ))}
                {isCustomType && (
                  <SelectItem key={group.type} value={group.type}>
                    {group.type}
                  </SelectItem>
                )}
                <SelectItem
                  value="__custom__"
                  className="text-primary font-medium"
                >
                  + Шинээр нэмэх...
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Values Tags and Input */}
        <div className="flex-1 flex items-center gap-2 flex-wrap border rounded-md px-3 h-10">
          {group.values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-sm"
            >
              {value}
              <button
                type="button"
                onClick={() => onRemoveValue(value)}
                className="hover:bg-primary-foreground/20 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Сонголтууд"
            value={newValueInput}
            onChange={(e) => onNewValueInputChange(e.target.value)}
            onKeyDown={onKeyPress}
            onBlur={() => onAddValue(newValueInput)}
            className="flex-1 min-w-[80px] outline-none bg-transparent text-sm"
          />
        </div>
      </div>
    </div>
  );
}

interface VariantsTableProps {
  variants: GeneratedVariant[];
  updateVariant: (
    variantId: string,
    field: keyof GeneratedVariant,
    value: string,
  ) => void;
}

function VariantsTable({ variants, updateVariant }: VariantsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[minmax(150px,1fr)_150px_150px_100px_120px_130px_60px] gap-2 bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div>Төрөл</div>
        <div>Үнэ</div>
        <div>Хямдарсан үнэ</div>
        <div>Тоо ширхэг</div>
        <div>Код (SKU)</div>
        <div>Төлөв</div>
        <div>Зураг</div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {variants.map((variant) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            updateVariant={updateVariant}
          />
        ))}
      </div>
    </div>
  );
}

interface VariantRowProps {
  variant: GeneratedVariant;
  updateVariant: (
    variantId: string,
    field: keyof GeneratedVariant,
    value: string,
  ) => void;
}

function VariantRow({ variant, updateVariant }: VariantRowProps) {
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
      console.error("Upload failed:", err);
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

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    await processFiles(files);
  };

  return (
    <div className="grid grid-cols-[minmax(150px,1fr)_150px_150px_100px_120px_130px_60px] gap-2 px-4 py-3 items-center">
      {/* Combination */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 shrink-0 rounded-full bg-green-500" />
        <span className="text-sm font-medium">{variant.combination}</span>
      </div>

      {/* Price */}
      <div>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Үнэ"
          value={formatPrice(variant.price)}
          onChange={(e) =>
            updateVariant(variant.id, "price", parsePrice(e.target.value))
          }
          className="h-9"
        />
      </div>

      {/* Discount Price */}
      <div>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Хямдарсан үнэ"
          value={formatPrice(variant.discountPrice)}
          onChange={(e) =>
            updateVariant(
              variant.id,
              "discountPrice",
              parsePrice(e.target.value),
            )
          }
          className="h-9"
        />
      </div>

      {/* Stock Quantity */}
      <div>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={variant.stockQuantity}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, "");
            updateVariant(variant.id, "stockQuantity", val);
          }}
          className="h-9"
        />
      </div>

      {/* SKU */}
      <div>
        <Input
          placeholder="SKU"
          value={variant.sku}
          onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
          className="h-9"
        />
      </div>

      {/* Status */}
      <div>
        <Select
          value={variant.status}
          onValueChange={(value) =>
            updateVariant(variant.id, "status", value as "active" | "inactive")
          }
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

      {/* Image */}
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
    </div>
  );
}
