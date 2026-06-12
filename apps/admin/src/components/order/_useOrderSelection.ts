"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi } from "@/lib/admin-api";

const STORAGE_KEY = "admin:selectedOrderIds";

function loadInitial(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

interface UseOrderSelectionInput {
  filterKey: string;
  serverFilters: Record<string, string> | undefined;
}

/**
 * Selection state for the orders list: a Set of order ids, persisted to
 * sessionStorage so navigating to an order detail and back preserves picks.
 * Selection is cleared automatically when filters change.
 */
export function useOrderSelection({ filterKey, serverFilters }: UseOrderSelectionInput) {
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(loadInitial);

  useEffect(() => {
    if (selectedOrderIds.size > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedOrderIds]));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedOrderIds]);

  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setSelectedOrderIds(new Set());
    }
  }, [filterKey]);

  const toggleOne = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const selectAllAcrossPages = useCallback(async () => {
    const allOrders = await adminApi.getAllBatched<{ id: string }>("orders", {
      select: "id",
      filters: serverFilters,
    });
    setSelectedOrderIds(new Set(allOrders.map((o) => o.id)));
  }, [serverFilters]);

  const toggleAllAcrossPages = useCallback(
    async (selected: boolean) => {
      if (!selected) {
        setSelectedOrderIds(new Set());
        return;
      }
      await selectAllAcrossPages();
    },
    [selectAllAcrossPages],
  );

  const clear = useCallback(() => setSelectedOrderIds(new Set()), []);

  return {
    selectedOrderIds,
    selectedCount: selectedOrderIds.size,
    toggleOne,
    toggleAllAcrossPages,
    selectAllAcrossPages,
    clear,
  };
}
