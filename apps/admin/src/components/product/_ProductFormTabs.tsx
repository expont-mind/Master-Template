"use client";

import { cn } from "@/lib/utils";

export type ProductFormTab = "info" | "category" | "options" | "reviews";

interface TabDefinition {
  value: ProductFormTab;
  label: string;
  show?: boolean;
}

export function buildProductFormTabs({
  hasMultipleOptions,
  isNew,
}: {
  hasMultipleOptions: boolean;
  isNew: boolean;
}): TabDefinition[] {
  return [
    { value: "info", label: "Мэдээлэл" },
    { value: "category", label: "Веб ангилал" },
    { value: "options", label: "Сонголт", show: hasMultipleOptions },
    { value: "reviews", label: "Сэтгэгдэл", show: !isNew },
  ];
}

export function ProductFormTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: TabDefinition[];
  activeTab: ProductFormTab;
  onChange: (tab: ProductFormTab) => void;
}) {
  return (
    <div className="flex border-b mb-6">
      {tabs
        .filter((tab) => tab.show !== false)
        .map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
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
  );
}
