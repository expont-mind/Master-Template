"use client";

import { useMemo, useState } from "react";

import type { Brand } from "@/lib/queries/brands";

export function useBrandsFilter(brands: Brand[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const filteredBrands = useMemo(() => {
    let result = brands;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((brand) => brand.name.toLowerCase().includes(query));
    }

    if (activeLetter) {
      if (activeLetter === "#") {
        result = result.filter((brand) => !/^[A-Za-z]/.test(brand.name));
      } else {
        result = result.filter((brand) => brand.name.toUpperCase().startsWith(activeLetter));
      }
    }

    return result;
  }, [searchQuery, activeLetter, brands]);

  const handleLetterClick = (letter: string) => {
    setActiveLetter((prev) => (prev === letter ? null : letter));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setActiveLetter(null);
  };

  return {
    searchQuery,
    activeLetter,
    filteredBrands,
    handleLetterClick,
    handleSearchChange,
  };
}
