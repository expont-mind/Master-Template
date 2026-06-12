import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "monpang:recent-searches";
const MAX_ITEMS = 10;

function getStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStored(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // One-time hydration from localStorage (external store).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentSearches(getStored());
  }, []);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX_ITEMS);
      setStored(next);
      return next;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== query);
      setStored(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setRecentSearches([]);
    setStored([]);
  }, []);

  return { recentSearches, addSearch, removeSearch, clearAll };
}
