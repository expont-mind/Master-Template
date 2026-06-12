"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { CategoryProductsPagination } from "./_CategoryProductsPagination";
import { CategoryProductsTable } from "./_CategoryProductsTable";
import { useCategoryProducts } from "./_useCategoryProducts";

interface CategoryProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
}

export function CategoryProductsDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName: _categoryName,
}: CategoryProductsDialogProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useCategoryProducts({
    open,
    categoryId,
    page,
    pageSize,
    search,
  });

  const products = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[694px] p-0 flex flex-col">
        <SheetHeader className="px-4 sm:px-8 pt-6 sm:pt-8 pb-0">
          <SheetTitle className="text-xl">Бүтээгдэхүүнүүд</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 px-4 sm:px-8 pt-6 pb-6 sm:pb-8 overflow-hidden">
          {/* Search */}
          <div className="group relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Бараа хайх"
              className="pl-9 h-8 transition-shadow duration-200"
            />
          </div>

          <CategoryProductsTable products={filteredProducts} isLoading={isLoading} />

          <CategoryProductsPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
