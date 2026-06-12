"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISCOUNT_FILTER_LABELS, PRODUCT_STATUS_LABELS, STOCK_FILTER_LABELS } from "@/constants";

interface ProductListFiltersProps {
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  stockFilter: string;
  setStockFilter: (v: string) => void;
  discountFilter: string;
  setDiscountFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  brandFilter: string;
  setBrandFilter: (v: string) => void;
  categories: { id: string; name: string; parent_id: string | null }[];
  brands: { id: string; name: string }[];
}

export function ProductListFilters(props: ProductListFiltersProps) {
  const hasActiveFilter =
    props.statusFilter !== "all" ||
    props.stockFilter !== "all" ||
    props.discountFilter !== "all" ||
    props.categoryFilter !== "all" ||
    props.brandFilter !== "all";

  const clearAll = () => {
    props.setStatusFilter("all");
    props.setStockFilter("all");
    props.setDiscountFilter("all");
    props.setCategoryFilter("all");
    props.setBrandFilter("all");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <LabeledSelect
        label="Төлөв:"
        value={props.statusFilter}
        onValueChange={props.setStatusFilter}
        width="w-[120px]"
        includeAll
        options={Object.entries(PRODUCT_STATUS_LABELS)}
      />
      <LabeledSelect
        label="Нөөц:"
        value={props.stockFilter}
        onValueChange={props.setStockFilter}
        width="w-[130px]"
        options={Object.entries(STOCK_FILTER_LABELS)}
      />
      <LabeledSelect
        label="Хямдрал:"
        value={props.discountFilter}
        onValueChange={props.setDiscountFilter}
        width="w-[130px]"
        options={Object.entries(DISCOUNT_FILTER_LABELS)}
      />
      <CategoryFilter
        value={props.categoryFilter}
        onValueChange={props.setCategoryFilter}
        categories={props.categories}
      />
      <LabeledSelect
        label="Брэнд:"
        value={props.brandFilter}
        onValueChange={props.setBrandFilter}
        width="w-[160px]"
        includeAll
        options={props.brands.map((b) => [b.id, b.name] as [string, string])}
      />
      {hasActiveFilter && (
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearAll}>
          <X className="h-4 w-4 mr-1" />
          Цэвэрлэх
        </Button>
      )}
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onValueChange,
  width,
  options,
  includeAll = false,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  width: string;
  options: [string, string][];
  includeAll?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={width}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="all">Бүгд</SelectItem>}
          {options.map(([key, optLabel]) => (
            <SelectItem key={key} value={key}>
              {optLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CategoryFilter({
  value,
  onValueChange,
  categories,
}: {
  value: string;
  onValueChange: (v: string) => void;
  categories: { id: string; name: string; parent_id: string | null }[];
}) {
  const parents = categories.filter((c) => !c.parent_id);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ангилал:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Бүгд</SelectItem>
          {parents.map((parent) => (
            <div key={parent.id}>
              <SelectItem value={parent.id} className="font-medium">
                {parent.name}
              </SelectItem>
              {categories
                .filter((c) => c.parent_id === parent.id)
                .map((child) => (
                  <SelectItem key={child.id} value={child.id} className="pl-6">
                    {child.name}
                  </SelectItem>
                ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
