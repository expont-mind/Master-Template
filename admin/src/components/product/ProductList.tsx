"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
// XLSX is loaded dynamically in exportProductsToExcel to reduce bundle size
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, DataTablePagination } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Search,
  Download,
  Loader2,
  ArrowUpDown,
  Package,
  Plus,
  X,
} from "lucide-react";
import {
  PRODUCT_STATUS_LABELS,
  STOCK_FILTER_LABELS,
  DISCOUNT_FILTER_LABELS,
} from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { useProductList, type SortOption } from "@/hooks/useProductList";
import { queryKeys } from "@/lib/query-keys";
import { getColumns } from "./columns";
import { QrCodeDialog } from "./QrCodeDialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { Product } from "./types";
import { parseAsUTC } from "@/lib/utils/formatters";
import { format } from "date-fns";

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

function formatDateForExport(dateString: string): string {
  const date = parseAsUTC(dateString);
  return date.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
}

const PRODUCTS_PER_EXPORT_FILE = 500;

async function writeProductsXlsxFile(
  products: Product[],
  startIdx: number,
  suffix: string,
) {
  const XLSX = await import("xlsx");
  const headers = ["№", "Нэр", "Брэнд", "Ангилал", "Үнэ", "Хямдралын үнэ", "Нөөц", "Төлөв", "Эх линк", "Үүсгэсэн огноо"];

  const data = products.map((product, idx) => {
    const categories = (product.product_categories || [])
      .map((pc) => pc.categories?.name)
      .filter(Boolean)
      .join(", ");

    return [
      startIdx + idx + 1,
      product.name,
      product.brands?.name || "-",
      categories || "-",
      product.price,
      product.discount_price ?? "-",
      product.stock_quantity ?? "-",
      PRODUCT_STATUS_LABELS[product.status] || product.status,
      product.original_url || "-",
      formatDateForExport(product.created_at),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = [
    { wch: 5 },   // №
    { wch: 40 },  // Нэр
    { wch: 20 },  // Брэнд
    { wch: 25 },  // Ангилал
    { wch: 12 },  // Үнэ
    { wch: 12 },  // Хямдралын үнэ
    { wch: 8 },   // Нөөц
    { wch: 12 },  // Төлөв
    { wch: 50 },  // Эх линк
    { wch: 20 },  // Огноо
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Бүтээгдэхүүн");
  XLSX.writeFile(wb, `бүтээгдэхүүн_${new Date().toISOString().split("T")[0]}${suffix}.xlsx`);
}

async function exportProductsToExcel(products: Product[]) {
  if (products.length <= PRODUCTS_PER_EXPORT_FILE) {
    await writeProductsXlsxFile(products, 0, "");
    return { fileCount: 1 };
  }
  const chunks: Product[][] = [];
  for (let i = 0; i < products.length; i += PRODUCTS_PER_EXPORT_FILE) {
    chunks.push(products.slice(i, i + PRODUCTS_PER_EXPORT_FILE));
  }
  for (let i = 0; i < chunks.length; i++) {
    await writeProductsXlsxFile(
      chunks[i],
      i * PRODUCTS_PER_EXPORT_FILE,
      `_хэсэг${i + 1}-${chunks.length}`,
    );
    await new Promise((r) => setTimeout(r, 300));
  }
  return { fileCount: chunks.length };
}

export function ProductList() {
  const router = useRouter();
  const {
    filteredProducts,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stockFilter,
    setStockFilter,
    discountFilter,
    setDiscountFilter,
    categoryFilter,
    setCategoryFilter,
    brandFilter,
    setBrandFilter,
    sortOption,
    setSortOption,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    deleteTarget,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    rowSelection,
    setRowSelection,
    selectedCount,
  } = useProductList();

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => adminApi.getAll<{ id: string; name: string; parent_id: string | null }>("categories", { select: "id, name, parent_id", order: "name.asc" }),
    staleTime: 5 * 60_000,
  });

  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: () => adminApi.getAll<{ id: string; name: string }>("brands", { select: "id, name", order: "name.asc" }),
    staleTime: 5 * 60_000,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [qrTarget, setQrTarget] = useState<Product | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQrClick = useCallback((product: Product) => {
    setQrTarget(product);
  }, []);

  const handleDuplicate = useCallback((product: Product) => {
    router.push(`/products/new?duplicate=${product.id}`);
  }, [router]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const serverFilters: Record<string, string> = {};
      if (searchQuery.trim()) serverFilters["search_words"] = searchQuery.trim();
      if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;
      if (stockFilter === "out") serverFilters["stock_quantity.eq"] = "0";
      if (stockFilter === "low") { serverFilters["stock_quantity.lt"] = "10"; serverFilters["stock_quantity.gt"] = "0"; }
      if (stockFilter === "in_stock") serverFilters["stock_quantity.gte"] = "10";
      if (discountFilter === "has") serverFilters["discount_price.gt"] = "0";
      if (discountFilter === "none") serverFilters["discount_price.is"] = "null";
      if (categoryFilter !== "all") serverFilters["category_id"] = categoryFilter;
      if (brandFilter !== "all") serverFilters["brand_id.eq"] = brandFilter;
      if (dateFrom) serverFilters["created_at.gte"] = new Date(`${dateFrom}T00:00:00`).toISOString();
      if (dateTo) serverFilters["created_at.lte"] = new Date(`${dateTo}T23:59:59`).toISOString();

      const allProducts = await adminApi.getAllBatched<Product>("products", {
        select: `id, name, price, discount_price, stock_quantity, status, original_url, created_at, brands(id, name), product_categories(category_id, categories(id, name))`,
        order: "created_at.desc",
        filters: serverFilters,
      });
      const { fileCount } = await exportProductsToExcel(allProducts);
      if (fileCount > 1) {
        toast.success(
          `Экспорт ${fileCount} файл болж хуваагдлаа (${PRODUCTS_PER_EXPORT_FILE} бүтээгдэхүүн бүрт).`,
        );
      }
    } finally {
      setIsExporting(false);
    }
  }, [searchQuery, statusFilter, stockFilter, discountFilter, categoryFilter, brandFilter, dateFrom, dateTo]);

  const columns = useMemo(
    () => getColumns({ onDelete: handleDeleteClick, onQrClick: handleQrClick, onDuplicate: handleDuplicate }),
    [handleDeleteClick, handleQrClick, handleDuplicate],
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Бүтээгдэхүүний нэр, ангиллаар хайх"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <DateRangePicker
            from={dateFrom ? new Date(dateFrom) : undefined}
            to={dateTo ? new Date(dateTo) : undefined}
            onChange={({ from, to }) => {
              setDateFrom(from ? format(from, "yyyy-MM-dd") : "");
              setDateTo(to ? format(to, "yyyy-MM-dd") : "");
            }}
            className="w-[280px]"
          />

          {/* Export */}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Татах
          </Button>



          {/* Sort Dropdown */}
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
                  checked={sortOption === opt.value}
                  onCheckedChange={() => setSortOption(opt.value)}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => router.push("/products/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Бүтээгдэхүүн нэмэх</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Төлөв:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Нөөц:</span>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STOCK_FILTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Хямдрал:</span>
          <Select value={discountFilter} onValueChange={setDiscountFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DISCOUNT_FILTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ангилал:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              {categories.filter((c) => !c.parent_id).map((parent) => (
                <div key={parent.id}>
                  <SelectItem value={parent.id} className="font-medium">
                    {parent.name}
                  </SelectItem>
                  {categories.filter((c) => c.parent_id === parent.id).map((child) => (
                    <SelectItem key={child.id} value={child.id} className="pl-6">
                      {child.name}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Брэнд:</span>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(statusFilter !== "all" || stockFilter !== "all" || discountFilter !== "all" || categoryFilter !== "all" || brandFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              setStatusFilter("all");
              setStockFilter("all");
              setDiscountFilter("all");
              setCategoryFilter("all");
              setBrandFilter("all");
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Цэвэрлэх
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        onRowClick={(row) => {
          if (clickTimer.current) {
            clearTimeout(clickTimer.current);
          }
          clickTimer.current = setTimeout(() => {
            router.push(`/products/${row.id}`);
          }, 300);
        }}
        onRowDoubleClick={(row) => {
          if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
          }
          window.open(`/products/${row.id}`, "_blank");
        }}
        emptyTitle="Бүтээгдэхүүн байхгүй"
        emptyDescription="Эхний бүтээгдэхүүнээ нэмнэ үү"
        emptyIcon={Package}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      {/* Pagination */}
      <DataTablePagination
        pageIndex={page - 1}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        selectedCount={selectedCount}
      />

      {/* QR Code Dialog */}
      <QrCodeDialog
        open={!!qrTarget}
        onOpenChange={(open) => !open && setQrTarget(null)}
        productName={qrTarget?.name}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && handleDeleteCancel()}
        title="Бүтээгдэхүүн устгах"
        description={`"${deleteTarget?.name}" бүтээгдэхүүнийг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
