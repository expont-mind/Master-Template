"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { useOrderList } from "@/hooks/useOrderList";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { OrderListHeader, OrderListTabs } from "./_OrderListHeader";
import { OrdersTabPanel } from "./_OrdersTabPanel";
import { useOrderBulkActions } from "./_useOrderBulkActions";
import { useOrderSelection } from "./_useOrderSelection";
import { getColumns, type OrderTableMeta } from "./columns";
import { OrderBoxPrintSheet } from "./OrderBoxPrint";
import { OrderProductsTab } from "./OrderProductsTab";
import { OrderStickerPrintSheet } from "./OrderStickerPrint";

import type { DeliveryStatus } from "@/types/database";

export function OrderList() {
  const queryClient = useQueryClient();
  const {
    filteredOrders,
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
  } = useOrderList();

  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");

  const filterKey = `${paymentFilter}|${paymentStatusFilter}|${dateFrom}|${dateTo}`;
  const {
    selectedOrderIds,
    selectedCount,
    toggleOne,
    toggleAllAcrossPages,
    selectAllAcrossPages,
    clear,
  } = useOrderSelection({ filterKey, serverFilters });

  const bulk = useOrderBulkActions({
    selectedOrderIds,
    selectedCount,
    orderBy,
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      deliveryStatus,
    }: {
      orderId: string;
      deliveryStatus: DeliveryStatus;
    }) =>
      adminApi.update("orders", orderId, {
        delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  const handleUpdateDeliveryStatus = useCallback(
    (orderId: string, deliveryStatus: DeliveryStatus) => {
      updateDeliveryStatusMutation.mutate({ orderId, deliveryStatus });
    },
    [updateDeliveryStatusMutation],
  );

  const columns = useMemo(() => getColumns(), []);

  const tableMeta: OrderTableMeta = useMemo(
    () => ({
      onUpdateDeliveryStatus: handleUpdateDeliveryStatus,
      paymentStatusFilter,
      selectedOrderIds,
      onToggleOrder: toggleOne,
      onToggleAllOrders: toggleAllAcrossPages,
    }),
    [
      handleUpdateDeliveryStatus,
      paymentStatusFilter,
      selectedOrderIds,
      toggleOne,
      toggleAllAcrossPages,
    ],
  );

  return (
    <div className="space-y-6">
      <OrderListHeader
        isFetching={isFetching}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })}
      />

      <OrderListTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCount={selectedCount}
        totalCount={totalCount ?? filteredOrders.length}
        onClearSelection={clear}
        onSelectAll={selectAllAcrossPages}
      />

      {activeTab === "orders" ? (
        <OrdersTabPanel
          filteredOrders={filteredOrders}
          isLoading={isLoading}
          columns={columns}
          tableMeta={tableMeta}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalCount={totalCount ?? filteredOrders.length}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          paymentStatusFilter={paymentStatusFilter}
          setPaymentStatusFilter={setPaymentStatusFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateRange={setDateRange}
          selectedCount={selectedCount}
          isBoxPrintLoading={bulk.isBoxPrintLoading}
          isStickerLoading={bulk.isStickerLoading}
          isExporting={bulk.isExporting}
          onBoxPrint={bulk.handleBoxPrint}
          onStickerPrint={bulk.handleStickerPrint}
          onDownload={bulk.handleDownload}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          serverTotalCount={totalCount}
        />
      ) : (
        <OrderProductsTab selectedOrderIds={selectedOrderIds} onPrinted={bulk.handleBoxPrinted} />
      )}
      <OrderBoxPrintSheet
        orders={bulk.boxPrintOrders}
        open={bulk.boxPrintOpen}
        onOpenChange={bulk.setBoxPrintOpen}
        onPrinted={bulk.handleBoxPrinted}
      />
      <OrderStickerPrintSheet
        orders={bulk.stickerPrintOrders}
        open={bulk.stickerPrintOpen}
        onOpenChange={bulk.setStickerPrintOpen}
        onPrinted={bulk.handleStickerPrinted}
      />
    </div>
  );
}
