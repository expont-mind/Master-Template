"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Package } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminApi } from "@/lib/admin-api";

import { BrandProductRow, type BrandProductRowData } from "./_BrandProductRow";
import { BrandProductsPagination } from "./_BrandProductsPagination";

interface BrandProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  brandName: string;
}

export function BrandProductsDialog({
  open,
  onOpenChange,
  brandId,
  brandName,
}: BrandProductsDialogProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["brand-products", brandId, page, pageSize, search],
    queryFn: async () => {
      const result = await adminApi.getAllPaginated<BrandProductRowData>("products", {
        select: "id,name,price,product_images(url)",
        order: "name.asc",
        limit: pageSize,
        offset: (page - 1) * pageSize,
        filters: {
          "brand_id.eq": brandId,
        },
      });
      return result;
    },
    enabled: open && !!brandId,
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
          <SheetTitle className="text-xl">{brandName} бүтээгдэхүүнүүд</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 px-4 sm:px-8 pt-6 pb-6 sm:pb-8 overflow-hidden">
          <div className="group relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Бараа хайх"
              className="pl-9 h-8 transition-shadow duration-200"
            />
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex items-center border-b text-sm font-medium text-muted-foreground">
              <div className="w-[56px] sm:w-[72px] shrink-0 py-2.5 px-2">Зураг</div>
              <div className="flex-1 py-2.5 px-2">Нэр</div>
              <div className="w-[80px] sm:w-[110px] shrink-0 py-2.5 px-2">Үнэ</div>
              <div className="w-[48px] shrink-0 hidden sm:block" />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 animate-in fade-in duration-300">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
                <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Бүтээгдэхүүн олдсонгүй</p>
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <BrandProductRow key={product.id} product={product} index={index} />
              ))
            )}
          </div>

          <BrandProductsPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
