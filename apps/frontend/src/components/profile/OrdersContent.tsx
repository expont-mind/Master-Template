"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Box, TruckGray, BoxCancel, ChevronRightProduct, Slash } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";
import { useUIStore } from "@/stores/ui-store";

import { deleteUnpaidOrder } from "./actions";
import { DeleteModal } from "./DeleteModal";
import { OrderCard } from "./OrderCard";
import { OrderDetailView } from "./OrderDetailView";

import type { ProfileOrder } from "@/app/profile/page";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

const tabs = ["Захиалсан", "Хүргэгдсэн", "Цуцлагдсан"] as const;

// Empty state content for each tab
const emptyStateContent: Record<number, { icon: React.ReactNode; text: string }> = {
  0: {
    icon: <Box />,
    text: "Захиалсан бараа алга байна",
  },
  1: {
    icon: <TruckGray />,
    text: "Хүргэгдсэн бараа алга байна",
  },
  2: {
    icon: <BoxCancel />,
    text: "Цуцлагдсан бараа алга байна",
  },
};

interface OrdersContentProps {
  orders: ProfileOrder[];
  addresses: AddressRow[];
  user: UserRow | null;
  initialOrderId?: string | null;
}

function OrdersHeader() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 md:hidden px-px">
        <Link
          href="/profile"
          className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
        >
          Профайл
        </Link>
        <Slash />
        <p className="text-slate-950 text-sm font-normal font-manrope">Миний захиалгууд</p>
      </div>
      <div className="flex items-center py-0 md:py-0.5">
        <div className="ml-[-4px] w-8 h-8 relative hidden md:block">
          <Image src="/orders.png" alt="orders" fill className="object-contain" />
        </div>
        <p className="text-text-primary font-bold md:font-medium text-2xl md:text-lg font-manrope">
          Миний захиалгууд
        </p>
      </div>
    </div>
  );
}

function OrdersTabBar({
  activeTab,
  getTabCount,
  onChange,
}: {
  activeTab: number;
  getTabCount: (i: number) => number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto scrollbar-hide">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => onChange(index)}
          className={`shrink-0 lg:shrink lg:flex-1 h-8 px-4 lg:px-0 rounded-full text-sm border font-manrope font-normal cursor-pointer transition-colors ${
            index === activeTab
              ? "bg-text-primary border-text-primary text-white font-medium"
              : "bg-white border-border text-text-secondary hover:bg-surface"
          }`}
        >
          {tab} ({getTabCount(index)})
        </button>
      ))}
    </div>
  );
}

function EmptyOrdersState({ activeTab }: { activeTab: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-10">
      <div className="flex flex-col items-center justify-center">
        <div className="p-[9px]">{emptyStateContent[activeTab].icon}</div>
        <MutedText>{emptyStateContent[activeTab].text}</MutedText>
      </div>
      <Link
        href="/products"
        className="px-3 py-2.5 flex items-center gap-0.5 text-text-primary font-normal text-base font-manrope underline underline-offset-4 decoration-[0.96px]"
      >
        <span className="px-0.5">Бараа сонирхох</span>
        <ChevronRightProduct />
      </Link>
    </div>
  );
}

export const OrdersContent = ({ orders, addresses, user, initialOrderId }: OrdersContentProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId ?? null);

  // Local copy of orders so deletion can update the list without a server
  // round-trip. Mirrors mobile's ProfileController.cancelOrder which removes
  // the order from its observable list after a successful RPC.
  const [localOrders, setLocalOrders] = useState<ProfileOrder[]>(orders);
  useEffect(() => {
    // Resync local copy when the parent's orders array changes (e.g. after refetch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalOrders(orders);
  }, [orders]);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  // Sync selectedOrderId when navigating from notifications
  useEffect(() => {
    if (initialOrderId) {
      // Open the order panel when arriving via notification deep link.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteUnpaidOrder(pendingDeleteId);
    if (result.success) {
      setLocalOrders((prev) => prev.filter((o) => o.id !== pendingDeleteId));
      setPendingDeleteId(null);
      addToast({
        type: "success",
        title: "Захиалга амжилттай устгагдлаа",
      });
    } else {
      setDeleteError(result.error);
    }
    setIsDeleting(false);
  };

  const handleCloseDelete = () => {
    if (isDeleting) return;
    setPendingDeleteId(null);
    setDeleteError(null);
  };

  const filterOrderByTab = (order: ProfileOrder, tabIndex: number) => {
    if (tabIndex === 1) {
      return order.delivery_status === "delivered";
    }
    if (tabIndex === 2) {
      return order.payment_status === "failed" || order.delivery_status === "canceled";
    }
    // Tab 0: Захиалсан — not delivered and not canceled/failed
    return (
      order.delivery_status !== "delivered" &&
      order.delivery_status !== "canceled" &&
      order.payment_status !== "failed"
    );
  };

  const filteredOrders = localOrders.filter((order) => filterOrderByTab(order, activeTab));

  const getTabCount = (tabIndex: number) =>
    localOrders.filter((order) => filterOrderByTab(order, tabIndex)).length;

  const selectedOrder = selectedOrderId ? localOrders.find((o) => o.id === selectedOrderId) : null;

  // Show order detail view if an order is selected
  if (selectedOrder) {
    const isUnpaid =
      selectedOrder.payment_status === "unpaid" || selectedOrder.payment_status === "processing";
    return (
      <>
        <OrderDetailView
          order={selectedOrder}
          addresses={addresses}
          user={user}
          onBack={() => setSelectedOrderId(null)}
          onRequestDelete={
            isUnpaid
              ? () => {
                  setDeleteError(null);
                  setPendingDeleteId(selectedOrder.id);
                }
              : undefined
          }
        />
        <DeleteModal
          isOpen={pendingDeleteId !== null}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          title="Захиалга устгах гэж байна"
          description={deleteError ?? "Та энэ захиалгыг устгахдаа итгэлтэй байна уу?"}
          isDeleting={isDeleting}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-0">
      <div className="flex flex-col gap-4 md:gap-2 px-0 md:px-4 pt-0 md:pt-2 pb-0 md:pb-1 ">
        <OrdersHeader />
        <OrdersTabBar activeTab={activeTab} getTabCount={getTabCount} onChange={setActiveTab} />
      </div>

      <div className="flex flex-col gap-6 md:gap-5 md:p-4">
        {filteredOrders.length === 0 ? (
          <EmptyOrdersState activeTab={activeTab} />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onMoreClick={() => setSelectedOrderId(order.id)}
              onDelete={() => {
                setDeleteError(null);
                setPendingDeleteId(order.id);
              }}
            />
          ))
        )}
      </div>

      <DeleteModal
        isOpen={pendingDeleteId !== null}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Захиалга устгах гэж байна"
        description={deleteError ?? "Та энэ захиалгыг устгахдаа итгэлтэй байна уу?"}
        isDeleting={isDeleting}
      />
    </div>
  );
};
