"use client";

// Link target section for BannerForm. Renders the link-type toggle
// (none/category/product/link) and the appropriate selector (combobox
// or URL input) below it.

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { LinkType } from "./_useBannerFormState";

interface IdNamed {
  id: string;
  name: string;
}

interface BannerLinkSectionProps {
  linkType: LinkType;
  categories: IdNamed[];
  products: IdNamed[];
  formData: {
    category_id?: string | null;
    product_id?: string | null;
    link_url?: string | null;
  };
  categoryOpen: boolean;
  setCategoryOpen: (open: boolean) => void;
  productOpen: boolean;
  setProductOpen: (open: boolean) => void;
  onLinkTypeChange: (type: LinkType) => void;
  onSelectCategory: (id: string) => void;
  onSelectProduct: (id: string) => void;
  onLinkUrlChange: (url: string | null) => void;
}

function LinkTypeToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
        active
          ? "bg-white shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ComboBox({
  label,
  open,
  setOpen,
  selectedName,
  items,
  selectedId,
  searchPlaceholder,
  emptyText,
  onSelect,
}: {
  label: string;
  open: boolean;
  setOpen: (o: boolean) => void;
  selectedName: string | undefined;
  items: IdNamed[];
  selectedId: string | null | undefined;
  searchPlaceholder: string;
  emptyText: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedName ?? label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem key={item.id} value={item.name} onSelect={() => onSelect(item.id)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function BannerLinkSection({
  linkType,
  categories,
  products,
  formData,
  categoryOpen,
  setCategoryOpen,
  productOpen,
  setProductOpen,
  onLinkTypeChange,
  onSelectCategory,
  onSelectProduct,
  onLinkUrlChange,
}: BannerLinkSectionProps) {
  const selectedCategory = categories.find((c) => c.id === formData.category_id);
  const selectedProduct = products.find((p) => p.id === formData.product_id);

  return (
    <div className="space-y-3">
      <Label>Холбох</Label>

      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border p-1 bg-muted/30">
        <LinkTypeToggleButton active={linkType === "none"} onClick={() => onLinkTypeChange("none")}>
          Байхгүй
        </LinkTypeToggleButton>
        <LinkTypeToggleButton
          active={linkType === "category"}
          onClick={() => onLinkTypeChange("category")}
        >
          Ангилал
        </LinkTypeToggleButton>
        <LinkTypeToggleButton
          active={linkType === "product"}
          onClick={() => onLinkTypeChange("product")}
        >
          Бүтээгдэхүүн
        </LinkTypeToggleButton>
        <LinkTypeToggleButton active={linkType === "link"} onClick={() => onLinkTypeChange("link")}>
          Холбоос
        </LinkTypeToggleButton>
      </div>

      {linkType === "category" && (
        <ComboBox
          label="Ангилал сонгох..."
          open={categoryOpen}
          setOpen={setCategoryOpen}
          selectedName={selectedCategory?.name}
          items={categories}
          selectedId={formData.category_id}
          searchPlaceholder="Ангилал хайх..."
          emptyText="Ангилал олдсонгүй."
          onSelect={onSelectCategory}
        />
      )}

      {linkType === "product" && (
        <ComboBox
          label="Бүтээгдэхүүн сонгох..."
          open={productOpen}
          setOpen={setProductOpen}
          selectedName={selectedProduct?.name}
          items={products}
          selectedId={formData.product_id}
          searchPlaceholder="Бүтээгдэхүүн хайх..."
          emptyText="Бүтээгдэхүүн олдсонгүй."
          onSelect={onSelectProduct}
        />
      )}

      {linkType === "link" && (
        <Input
          value={formData.link_url ?? ""}
          onChange={(e) => onLinkUrlChange(e.target.value || null)}
          placeholder="https://example.com/page"
          type="url"
        />
      )}

      <p className="text-sm text-muted-foreground">Баннер дарахад сонгосон хуудас руу шилжинэ</p>
    </div>
  );
}
