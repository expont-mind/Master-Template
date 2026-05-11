"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { OrderWithUser } from "@/components/order/types";
import { queryKeys } from "@/lib/query-keys";
import { useTableParams } from "./useTableParams";
import { useResetPage } from "./useResetPage";

const DEFAULT_PAGE_SIZE = 20;

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useOrderList() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const { params, setParam, setParams } = useTableParams({
    page: 1,
    payment: "",
    paymentStatus: "",
    sort: "",
    pageSize: DEFAULT_PAGE_SIZE,
    dateFrom: "",
    dateTo: "",
  });

  // Seed URL with defaults on first load so URL is always copy-able
  useEffect(() => {
    const updates: Record<string, string> = {};
    if (!params.paymentStatus) updates.paymentStatus = "paid";
    if (!params.sort) updates.sort = "date_desc";
    if (Object.keys(updates).length > 0) setParams(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentFilter = params.payment || "all";
  const setPaymentFilter = (v: string) => setParam("payment", v);
  const paymentStatusFilter = params.paymentStatus || "paid";
  const setPaymentStatusFilter = (v: string) => setParam("paymentStatus", v);
  const sortOption = params.sort || "date_desc";
  const setSortOption = (v: string) => setParam("sort", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);
  const pageSize = params.pageSize;
  const setPageSize = (v: number) => setParam("pageSize", v);
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  const setDateRange = (from: string, to: string) =>
    setParams({ dateFrom: from, dateTo: to });

  // Reset page on filter or search change (skip initial mount)
  useResetPage(
    () => setPage(1),
    [paymentFilter, paymentStatusFilter, sortOption, debouncedSearch, pageSize, dateFrom, dateTo],
  );

  const serverFilters: Record<string, string> = {};
  if (paymentFilter !== "all")
    serverFilters["payment_method.eq"] = paymentFilter;
  if (paymentStatusFilter !== "all") {
    serverFilters["payment_status.eq"] = paymentStatusFilter;
  }
  // paid filter uses paid_at (when payment was confirmed), others use created_at
  const dateColumn = paymentStatusFilter === "paid" ? "paid_at" : "created_at";
  if (dateFrom) serverFilters[`${dateColumn}.gte`] = new Date(`${dateFrom}T00:00:00+08:00`).toISOString();
  if (dateTo) serverFilters[`${dateColumn}.lte`] = new Date(`${dateTo}T23:59:59.999+08:00`).toISOString();

  const searchTerm = debouncedSearch.trim();
  if (searchTerm) serverFilters["search"] = searchTerm;

  // Sort: paid uses paid_at, others use created_at
  const usePaidAtSort = paymentStatusFilter === "paid";
  const SORT_OPTIONS: Record<string, string> = {
    "date_desc": usePaidAtSort
      ? "paid_at.desc.nullslast,created_at.desc"
      : "created_at.desc",
    "date_asc": usePaidAtSort
      ? "paid_at.asc.nullslast,created_at.asc"
      : "created_at.asc",
    "amount_desc": "total_amount.desc",
    "amount_asc": "total_amount.asc",
  };
  const orderBy = SORT_OPTIONS[sortOption] || SORT_OPTIONS["date_desc"];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.orders.lists({
      page,
      pageSize,
      payment: paymentFilter,
      paymentStatus: paymentStatusFilter,
      sort: sortOption,
      search: debouncedSearch,
      dateFrom,
      dateTo,
    }),
    queryFn: () =>
      adminApi.getAllPaginated<OrderWithUser>("orders", {
        select:
          "id, user_id, order_number, status, delivery_status, total_amount, payment_status, payment_method, is_printed, is_products_printed, is_box_printed, is_downloaded, created_at, paid_at, delivery_city, delivery_district, delivery_sub_district, delivery_detail, users(id, first_name, last_name, email, primary_phone), order_items(id, variant_name, quantity, warehouse_id, is_returned, products(name)), payment_invoices(payment_wallet)",
        order: orderBy,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const orders = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / pageSize) : 1;

  return {
    orders,
    filteredOrders: orders,
    isLoading,
    isFetching,
    searchQuery,
    setSearchQuery,
    paymentFilter,
    setPaymentFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    sortOption,
    setSortOption,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize,
    setPageSize,
    dateFrom,
    dateTo,
    setDateRange,
    serverFilters,
    orderBy,
  };
}
