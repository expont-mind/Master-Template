"use client";

import { format } from "date-fns";
import { ArrowUpDown, Download, Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import type { SortOption } from "@/hooks/useProductList";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Шинэ нь эхэнддэ" },
  { value: "oldest", label: "Хуучин нь эхэндээ" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
  { value: "price_asc", label: "Үнэ өсөхөөр " },
  { value: "price_desc", label: "Үнэ буурахаар" },
  { value: "discount_asc", label: "Хямдралын үнэ өсөхөөр" },
  { value: "discount_desc", label: "Хямдралын үнэ буурахаар" },
  { value: "updated_desc", label: "Сүүлд шинэчилсэн" },
  { value: "updated_asc", label: "Эхэнд шинэчилсэн" },
];

interface ProductListToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  sortOption: SortOption;
  setSortOption: (v: SortOption) => void;
  isExporting: boolean;
  onExport: () => void;
  onAddNew: () => void;
}

export function ProductListToolbar(props: ProductListToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Бүтээгдэхүүний нэр, ангиллаар хайх"
          className="pl-10"
          value={props.searchQuery}
          onChange={(e) => props.setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker
          from={props.dateFrom ? new Date(props.dateFrom) : undefined}
          to={props.dateTo ? new Date(props.dateTo) : undefined}
          onChange={({ from, to }) => {
            props.setDateFrom(from ? format(from, "yyyy-MM-dd") : "");
            props.setDateTo(to ? format(to, "yyyy-MM-dd") : "");
          }}
          className="w-[280px]"
        />

        <Button variant="outline" size="sm" onClick={props.onExport} disabled={props.isExporting}>
          {props.isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Татах
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Эрэмбэлэх</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px]">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={props.sortOption === opt.value}
                onCheckedChange={() => props.setSortOption(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={props.onAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Бүтээгдэхүүн нэмэх</span>
        </Button>
      </div>
    </div>
  );
}
