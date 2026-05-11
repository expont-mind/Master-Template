"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Category } from "./types";

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-rose-100 text-rose-700",
  2: "bg-emerald-100 text-emerald-700",
  3: "bg-slate-100 text-slate-600",
};

interface ProductCategoryTabProps {
  categories: Category[];
  categoryIds: string[];
  setCategoryIds: (ids: string[]) => void;
}

interface FlatCategory {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
}

function flattenCategories(
  categories: Category[],
  parentId: string | null = null,
  level: number = 1
): FlatCategory[] {
  const result: FlatCategory[] = [];
  const children = categories.filter((c) => c.parent_id === parentId);
  for (const child of children) {
    result.push({ id: child.id, name: child.name, level, parentId: child.parent_id });
    result.push(...flattenCategories(categories, child.id, level + 1));
  }
  return result;
}

export function ProductCategoryTab({
  categories,
  categoryIds,
  setCategoryIds,
}: ProductCategoryTabProps) {
  const flatList = flattenCategories(categories);
  const [search, setSearch] = useState("");

  const filteredList = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return flatList;

    // Find categories matching search + include their ancestors
    const matchIds = new Set<string>();
    for (const cat of flatList) {
      if (cat.name.toLowerCase().includes(q)) {
        matchIds.add(cat.id);
        // Add ancestors so the tree structure is visible
        let parentId = cat.parentId;
        while (parentId) {
          matchIds.add(parentId);
          const parent = flatList.find((c) => c.id === parentId);
          parentId = parent?.parentId ?? null;
        }
      }
    }
    return flatList.filter((c) => matchIds.has(c.id));
  }, [flatList, search]);

  const toggleCategory = (categoryId: string) => {
    if (categoryIds.includes(categoryId)) {
      setCategoryIds(categoryIds.filter((id) => id !== categoryId));
    } else {
      setCategoryIds([...categoryIds, categoryId]);
    }
  };

  // Determine type: first selected category at level 1 is "Онцлох", rest are "Энгийн"
  const firstSelectedRoot = flatList.find(
    (c) => c.level === 1 && categoryIds.includes(c.id)
  );

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Бүтээгдэхүүний мэдээлэл</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ангилал хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="border rounded-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center border-b bg-muted/30 px-4 py-3">
            <span className="flex-1 text-sm font-medium text-muted-foreground">
              Ангиллын түшин ба дараалал
            </span>
            <span className="text-sm font-medium text-muted-foreground w-[80px] text-right">
              Төрөл
            </span>
          </div>

          {/* Rows */}
          {filteredList.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Ангилал олдсонгүй
            </div>
          ) : (
            filteredList.map((cat) => {
              const isSelected = categoryIds.includes(cat.id);
              const isFeatured =
                firstSelectedRoot && cat.id === firstSelectedRoot.id;
              const levelColor =
                LEVEL_COLORS[cat.level] ?? LEVEL_COLORS[3];
              const indent = (cat.level - 1) * 24;

              return (
                <div
                  key={cat.id}
                  className="flex items-center border-b last:border-b-0 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0"
                    style={{ paddingLeft: indent }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleCategory(cat.id)}
                      className="shrink-0"
                    />
                    <Badge
                      variant="secondary"
                      className={`${levelColor} shrink-0 text-xs px-2 py-0.5 font-medium`}
                    >
                      {cat.level}-р
                    </Badge>
                    <span className="text-sm truncate">{cat.name}</span>
                  </div>
                  <div className="w-[80px] text-right shrink-0">
                    <Badge
                      variant="secondary"
                      className={
                        isFeatured
                          ? "bg-rose-50 text-rose-600 text-xs"
                          : "bg-gray-50 text-gray-500 text-xs"
                      }
                    >
                      {isFeatured ? "Онцлох" : "Энгийн"}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
