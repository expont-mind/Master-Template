"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUPON_SCOPE_LABELS } from "@/constants";

import type { CouponFormData } from "./types";
import type { CouponScope } from "@/types/database";

interface ScopeItem {
  id: string;
  name: string;
}

interface CouponScopeSectionProps {
  formData: CouponFormData;
  updateFormData: (updates: Partial<CouponFormData>) => void;
  scopeItemIds: string[];
  setScopeItemIds: (ids: string[]) => void;
  scopeItemNames: Record<string, string>;
  setScopeItemNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  scopeItems: ScopeItem[];
  scopeSearch: string;
  setScopeSearch: (s: string) => void;
  fetchNextPage: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  isFetchingScopeItems: boolean;
}

function ScopeItemsList({
  scopeItems,
  scopeItemIds,
  isFetchingScopeItems,
  isFetchingNextPage,
  onToggle,
  listRef,
  onScroll,
}: {
  scopeItems: ScopeItem[];
  scopeItemIds: string[];
  isFetchingScopeItems: boolean;
  isFetchingNextPage: boolean;
  onToggle: (id: string, name: string, checked: boolean) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}) {
  return (
    <div
      ref={listRef}
      className="max-h-[240px] overflow-y-auto border rounded-md p-2 space-y-0.5"
      onScroll={onScroll}
    >
      {isFetchingScopeItems && scopeItems.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : scopeItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2 text-center">Илэрц олдсонгүй</p>
      ) : (
        <>
          {scopeItems.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={scopeItemIds.includes(item.id)}
                onChange={(e) => onToggle(item.id, item.name, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{item.name}</span>
            </label>
          ))}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SelectedItemChips({
  scopeItemIds,
  scopeItemNames,
  onRemove,
}: {
  scopeItemIds: string[];
  scopeItemNames: Record<string, string>;
  onRemove: (id: string) => void;
}) {
  if (scopeItemIds.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {scopeItemIds.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs"
        >
          {scopeItemNames[id] || id.slice(0, 8)}
          <button type="button" onClick={() => onRemove(id)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function CouponScopeSection({
  formData,
  updateFormData,
  scopeItemIds,
  setScopeItemIds,
  scopeItemNames,
  setScopeItemNames,
  scopeItems,
  scopeSearch,
  setScopeSearch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isFetchingScopeItems,
}: CouponScopeSectionProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleListScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScopeItemToggle = useCallback(
    (id: string, name: string, checked: boolean) => {
      if (checked) {
        setScopeItemIds([...scopeItemIds, id]);
        setScopeItemNames((prev) => ({ ...prev, [id]: name }));
      } else {
        setScopeItemIds(scopeItemIds.filter((i) => i !== id));
        setScopeItemNames((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [scopeItemIds, setScopeItemIds, setScopeItemNames],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хамрах хүрээ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Хамрах хүрээ</Label>
            <Select
              value={formData.scope}
              onValueChange={(value) => {
                const newScope = value as CouponScope;
                updateFormData({
                  scope: newScope,
                  ...(newScope === "all" ? { max_applicable_qty: null } : {}),
                });
                setScopeItemIds([]);
                setScopeItemNames({});
                setScopeSearch("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COUPON_SCOPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.scope !== "all" && (
            <div className="space-y-2">
              <Label htmlFor="max_applicable_qty">Хөнгөлөх барааны тоо</Label>
              <Input
                id="max_applicable_qty"
                type="number"
                value={formData.max_applicable_qty || ""}
                onChange={(e) =>
                  updateFormData({
                    max_applicable_qty: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Хязгааргүй"
                min={1}
              />
            </div>
          )}
        </div>

        {formData.scope !== "all" && (
          <div className="space-y-2">
            <Input
              placeholder={`${COUPON_SCOPE_LABELS[formData.scope]} хайх...`}
              value={scopeSearch}
              onChange={(e) => setScopeSearch(e.target.value)}
            />
            <ScopeItemsList
              scopeItems={scopeItems}
              scopeItemIds={scopeItemIds}
              isFetchingScopeItems={isFetchingScopeItems}
              isFetchingNextPage={isFetchingNextPage}
              onToggle={handleScopeItemToggle}
              listRef={listRef}
              onScroll={handleListScroll}
            />
            <SelectedItemChips
              scopeItemIds={scopeItemIds}
              scopeItemNames={scopeItemNames}
              onRemove={(id) => handleScopeItemToggle(id, "", false)}
            />
            <p className="text-sm text-muted-foreground">{scopeItemIds.length} сонгосон</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
