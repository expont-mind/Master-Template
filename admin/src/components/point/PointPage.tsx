"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PointFaqTab } from "./PointFaqTab";
import { PointShareTab } from "./PointShareTab";

type Tab = "faq" | "share";

const tabs: { value: Tab; label: string }[] = [
  { value: "share", label: "Point өгөх" },
  { value: "faq", label: "Point FAQ" },
];

export function PointPage() {
  const [activeTab, setActiveTab] = useState<Tab>("share");

  return (
    <div className="space-y-6">
      <p className="text-3xl font-bold tracking-tight">Поинт</p>

      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "faq" && <PointFaqTab />}
      {activeTab === "share" && <PointShareTab />}
    </div>
  );
}
