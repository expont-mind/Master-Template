"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, RefreshCw, X } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useCouponEdit } from "@/hooks/useCouponEdit";
import { COUPON_TYPE_LABELS, COUPON_SCOPE_LABELS } from "@/constants";
import type { CouponType, CouponScope } from "@/types/database";

interface CouponFormProps {
  id?: string;
}

export function CouponForm({ id }: CouponFormProps) {
  const {
    coupon,
    formData,
    isLoading,
    isSaving,
    error,
    isEditMode,
    deliveryFee,
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
    updateFormData,
    generateCode,
    handleSave,
  } = useCouponEdit(id);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/coupons">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? "Купон засах" : "Шинэ купон"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Купоны мэдээллийг засварлана уу"
                : "Шинэ купон үүсгэнэ үү"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Хадгалах
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Үндсэн мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Купоны код *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      updateFormData({ code: e.target.value.toUpperCase() })
                    }
                    placeholder="SUMMER2024"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCode}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Хөнгөлөлт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Төрөл *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      const type = value as CouponType;
                      if (type === "free_shipping") {
                        updateFormData({ type, discount_value: deliveryFee });
                      } else {
                        updateFormData({ type });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COUPON_TYPE_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.type === "free_shipping"
                      ? "Хүргэлтийн үнэ (₮)"
                      : `Утга * ${formData.type === "percentage" ? "(%)" : "(₮)"}`}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value || ""}
                    onChange={(e) =>
                      updateFormData({
                        discount_value: e.target.value
                          ? parseFloat(e.target.value)
                          : 0,
                      })
                    }
                    placeholder="0"
                    min={0}
                    max={formData.type === "percentage" ? 100 : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_purchase_amount">
                    Хамгийн бага худалдан авалт
                  </Label>
                  <Input
                    id="min_purchase_amount"
                    type="number"
                    value={formData.min_purchase_amount || ""}
                    onChange={(e) =>
                      updateFormData({
                        min_purchase_amount: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="₮0"
                    min={0}
                  />
                </div>

                {formData.type === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount_amount">
                      Хамгийн их хөнгөлөлт (₮)
                    </Label>
                    <Input
                      id="max_discount_amount"
                      type="number"
                      value={formData.max_discount_amount || ""}
                      onChange={(e) =>
                        updateFormData({
                          max_discount_amount: e.target.value
                            ? parseFloat(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Хязгааргүй"
                      min={0}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scope Card */}
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
                        ...(newScope === "all"
                          ? { max_applicable_qty: null }
                          : {}),
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
                    <Label htmlFor="max_applicable_qty">
                      Хөнгөлөх барааны тоо
                    </Label>
                    <Input
                      id="max_applicable_qty"
                      type="number"
                      value={formData.max_applicable_qty || ""}
                      onChange={(e) =>
                        updateFormData({
                          max_applicable_qty: e.target.value
                            ? parseInt(e.target.value)
                            : null,
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
                  <div
                    ref={listRef}
                    className="max-h-[240px] overflow-y-auto border rounded-md p-2 space-y-0.5"
                    onScroll={handleListScroll}
                  >
                    {isFetchingScopeItems && scopeItems.length === 0 ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : scopeItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2 text-center">
                        Илэрц олдсонгүй
                      </p>
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
                              onChange={(e) =>
                                handleScopeItemToggle(
                                  item.id,
                                  item.name,
                                  e.target.checked,
                                )
                              }
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

                  {/* Selected items chips */}
                  {scopeItemIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {scopeItemIds.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs"
                        >
                          {scopeItemNames[id] || id.slice(0, 8)}
                          <button
                            type="button"
                            onClick={() => handleScopeItemToggle(id, "", false)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {scopeItemIds.length} сонгосон
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ашиглалтын хязгаар</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Нийт ашиглалт</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit || ""}
                    onChange={(e) =>
                      updateFormData({
                        usage_limit: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Хязгааргүй"
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage_limit_per_user">
                    Хэрэглэгч тус бүрийн ашиглалт
                  </Label>
                  <Input
                    id="usage_limit_per_user"
                    type="number"
                    value={formData.usage_limit_per_user ?? ""}
                    onChange={(e) =>
                      updateFormData({
                        usage_limit_per_user: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Хязгааргүй"
                    min={1}
                  />
                </div>
              </div>

              {isEditMode && coupon && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Одоогийн ашиглалт:{" "}
                    <span className="font-medium">{coupon.usage_count}</span>
                    {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Тохиргоо</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Идэвхтэй</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    updateFormData({ is_active: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Хугацаа</CardTitle>
            </CardHeader>
            <CardContent>
              <DateRangePicker
                from={
                  formData.start_date
                    ? new Date(formData.start_date)
                    : undefined
                }
                to={formData.end_date ? new Date(formData.end_date) : undefined}
                onChange={({ from, to }) => {
                  const toUB = (d: Date) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    return `${y}-${m}-${day}`;
                  };
                  updateFormData({
                    start_date: from
                      ? new Date(`${toUB(from)}T00:00:00+08:00`).toISOString()
                      : null,
                    end_date: to
                      ? new Date(`${toUB(to)}T23:59:59+08:00`).toISOString()
                      : null,
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
