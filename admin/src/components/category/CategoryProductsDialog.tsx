"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Search,
  Loader2,
  Package,
} from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";

interface CategoryProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  images?: string[];
  product_images?: { url: string }[];
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function CategoryProductsDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: CategoryProductsDialogProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["category-products", categoryId, page, pageSize, search],
    queryFn: async () => {
      const result = await adminApi.getAllPaginated<{ products: ProductRow }>(
        "product_categories",
        {
          select: "products(id,name,price,discount_price,product_images(url))",
          order: "products(name).asc",
          limit: pageSize,
          offset: (page - 1) * pageSize,
          filters: {
            "category_id.eq": categoryId,
          },
        },
      );
      return {
        data: result.data.map((row) => row.products).filter(Boolean),
        totalCount: result.totalCount,
      };
    },
    enabled: open && !!categoryId,
  });

  const products = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const filteredProducts = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const getImageUrl = (product: ProductRow) => {
    if (product.product_images?.length) return product.product_images[0].url;
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[694px] p-0 flex flex-col"
      >
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

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {/* Table header */}
            <div className="flex items-center border-b text-sm font-medium text-muted-foreground">
              <div className="w-[56px] sm:w-[72px] shrink-0 py-2.5 px-2">Зураг</div>
              <div className="flex-1 py-2.5 px-2">Нэр</div>
              <div className="w-[80px] sm:w-[110px] shrink-0 py-2.5 px-2">Үнэ</div>
              <div className="w-[80px] sm:w-[110px] shrink-0 py-2.5 px-2 hidden sm:block">Бодит үнэ</div>
            </div>

            {/* Table rows */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12 animate-in fade-in duration-300">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
                <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Бүтээгдэхүүн олдсонгүй
                </p>
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const imgUrl = getImageUrl(product);
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group/row flex items-center border-b last:border-b-0 transition-colors duration-150 hover:bg-muted/30 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                    style={{ animationDelay: `${index * 30}ms`, animationDuration: "250ms" }}
                  >
                    <div className="w-[56px] sm:w-[72px] shrink-0 p-2">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="h-10 w-10 sm:h-14 sm:w-14 rounded-md object-cover transition-transform duration-200 group-hover/row:scale-105"
                        />
                      ) : (
                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-md bg-muted transition-colors duration-200" />
                      )}
                    </div>
                    <div className="flex-1 px-2 min-w-0">
                      <span className="text-sm truncate block">
                        {product.name}
                      </span>
                    </div>
                    <div className="w-[80px] sm:w-[110px] shrink-0 px-2">
                      <span className="text-sm">
                        {(product.discount_price ?? product.price)?.toLocaleString()}₮
                      </span>
                    </div>
                    <div className="w-[80px] sm:w-[110px] shrink-0 px-2 hidden sm:block">
                      {product.discount_price ? (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.price?.toLocaleString()}₮
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-sm border-t mt-auto animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground hidden sm:inline">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[80px] transition-shadow duration-200">
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

            <div className="flex items-center gap-4">
              <span className="text-muted-foreground tabular-nums">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 transition-all duration-150 active:scale-95"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 transition-all duration-150 active:scale-95"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 transition-all duration-150 active:scale-95"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 transition-all duration-150 active:scale-95"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
