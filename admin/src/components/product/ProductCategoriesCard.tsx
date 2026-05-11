"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Category } from "./types";

interface ProductCategoriesCardProps {
  categoryIds: string[];
  setCategoryIds: (categoryIds: string[]) => void;
  categories: Category[];
  isLoading?: boolean;
}

// Recursive category item component
function CategoryItem({
  category,
  categories,
  categoryIds,
  toggleCategory,
  level = 0,
}: {
  category: Category;
  categories: Category[];
  categoryIds: string[];
  toggleCategory: (id: string) => void;
  level?: number;
}) {
  const children = categories.filter((c) => c.parent_id === category.id);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center space-x-2"
        style={{ marginLeft: `${level * 1.5}rem` }}
      >
        <Checkbox
          id={`cat-${category.id}`}
          checked={categoryIds.includes(category.id)}
          onCheckedChange={() => toggleCategory(category.id)}
          className="cursor-pointer"
        />
        <Label
          htmlFor={`cat-${category.id}`}
          className={`text-sm cursor-pointer font-medium`}
        >
          {category.name}
        </Label>
      </div>
      {children.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          categories={categories}
          categoryIds={categoryIds}
          toggleCategory={toggleCategory}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export function ProductCategoriesCard({
  categoryIds,
  setCategoryIds,
  categories,
  isLoading,
}: ProductCategoriesCardProps) {
  const toggleCategory = (categoryId: string) => {
    const isSelected = categoryIds.includes(categoryId);
    if (isSelected) {
      setCategoryIds(categoryIds.filter((id) => id !== categoryId));
    } else {
      setCategoryIds([...categoryIds, categoryId]);
    }
  };

  // Get root categories (no parent)
  const rootCategories = categories.filter((c) => !c.parent_id);

  // Find orphan categories (have parent_id but parent doesn't exist in our list)
  const categoryIds_set = new Set(categories.map((c) => c.id));
  const orphanCategories = categories.filter(
    (c) => c.parent_id && !categoryIds_set.has(c.parent_id),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ангилал</CardTitle>
        <CardDescription>Бүтээгдэхүүний ангилал сонгох</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ангилал олдсонгүй</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {rootCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                categories={categories}
                categoryIds={categoryIds}
                toggleCategory={toggleCategory}
              />
            ))}
            {/* Orphan categories (parent doesn't exist) */}
            {orphanCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                categories={categories}
                categoryIds={categoryIds}
                toggleCategory={toggleCategory}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
