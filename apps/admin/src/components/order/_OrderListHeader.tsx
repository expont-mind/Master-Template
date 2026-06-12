"use client";

import { RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderListHeaderProps {
  isFetching: boolean;
  onRefresh: () => void;
}

export function OrderListHeader({ isFetching, onRefresh }: OrderListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-3xl font-bold tracking-tight">Захиалга</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isFetching}
        className="transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <RefreshCw
          className={cn(
            "h-4 w-4 mr-1 transition-transform duration-500",
            isFetching && "animate-spin",
          )}
        />
        Шинэчлэх
      </Button>
    </div>
  );
}

interface OrderListTabsProps {
  activeTab: "orders" | "products";
  setActiveTab: (tab: "orders" | "products") => void;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export function OrderListTabs({
  activeTab,
  setActiveTab,
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
}: OrderListTabsProps) {
  const tabs = [
    { value: "orders" as const, label: "Захиалга" },
    {
      value: "products" as const,
      label: selectedCount > 0 ? `Бараа (${selectedCount})` : "Бараа",
    },
  ];

  return (
    <div className="flex items-center justify-between border-b">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t" />
            )}
          </button>
        ))}
      </div>
      {selectedCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-3 w-3 mr-1" />
          {selectedCount} сонгосон
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          Бүгд сонгох ({totalCount})
        </Button>
      )}
    </div>
  );
}
