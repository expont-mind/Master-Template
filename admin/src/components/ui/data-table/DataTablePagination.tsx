"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/constants";

interface DataTablePaginationProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalCount: number | null;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  selectedCount?: number;
}

export function DataTablePagination({
  pageIndex,
  pageCount,
  onPageChange,
  totalCount,
  pageSize,
  onPageSizeChange,
  selectedCount = 0,
}: DataTablePaginationProps) {
  const [inputValue, setInputValue] = useState(String(pageIndex + 1));

  useEffect(() => {
    setInputValue(String(pageIndex + 1));
  }, [pageIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt(inputValue, 10);
      if (val >= 1 && val <= pageCount) {
        onPageChange(val - 1);
      } else {
        setInputValue(String(pageIndex + 1));
      }
    }
  };

  if (totalCount === null || totalCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="hidden sm:block text-sm text-muted-foreground">
        {selectedCount} of {totalCount} row(s) selected.
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Нэг нүүрэнд харагдах мөр
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[80px] cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(0)}
            disabled={pageIndex <= 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Input */}
          <div className="flex items-center gap-1">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 w-14 text-center"
            />
            <span className="text-sm text-muted-foreground">/ {pageCount}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
