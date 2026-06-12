"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { Tab } from "./_tree-helpers";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Бүх категори" },
  { value: "home", label: "Home дээрх" },
  { value: "category_menu", label: "Категори меню дээрх" },
];

interface CategoryToolbarProps {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
  search: string;
  onChangeSearch: (search: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onAddRoot: () => void;
}

export function CategoryToolbar({
  activeTab,
  onChangeTab,
  search,
  onChangeSearch,
  onExpandAll,
  onCollapseAll,
  onAddRoot,
}: CategoryToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b mb-6">
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChangeTab(tab.value)}
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
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Хайх..."
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            className="h-8 w-48 pl-8 text-sm"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onExpandAll}>
          Бүгдийг нээх
        </Button>
        <Button variant="ghost" size="sm" onClick={onCollapseAll}>
          Бүгдийг хаах
        </Button>
        <Button variant="outline" size="sm" onClick={onAddRoot}>
          <Plus className="h-4 w-4 mr-1" />
          Ангилал нэмэх
        </Button>
      </div>
    </div>
  );
}
