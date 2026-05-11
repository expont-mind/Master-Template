"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { CouponCard, type CouponData } from "@/components/profile/CouponCard";
import { createClient } from "@/lib/supabase/client";
import { parseAsUTC } from "@/lib/utils/formatters";
import { Cancel, Coupon } from "../svg";
import { PrimaryHeading } from "@/components/ui/typography";

const SCOPE_TABLE_MAP: Record<string, string> = {
  product: "coupon_products",
  category: "coupon_categories",
  brand: "coupon_brands",
};

const SCOPE_ID_FIELD_MAP: Record<string, string> = {
  product: "product_id",
  category: "category_id",
  brand: "brand_id",
};

interface CouponSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCouponId: string | null;
  onSelect: (coupon: CouponData | null) => void;
}

export const CouponSelectModal = ({
  isOpen,
  onClose,
  selectedCouponId,
  onSelect,
}: CouponSelectModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
      fetchCoupons();
    } else if (visible) {
      setAnimate(false);
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, visible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  const fetchCoupons = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // The user_coupons→coupons relation isn't declared in our hand-rolled
    // Database type's Relationships array, so PostgREST embed inference
    // fails. Narrow the shape with `.returns<>()` at the query boundary.
    type CouponEmbed = {
      id: string;
      code: string;
      type: "percentage" | "fixed" | "free_shipping";
      discount_value: number;
      max_discount_amount: number | null;
      end_date: string | null;
      is_active: boolean;
      start_date: string | null;
      scope: "all" | "product" | "category" | "brand";
      max_applicable_qty: number | null;
      usage_limit_per_user: number | null;
    };
    type UserCouponEmbedded = {
      id: string;
      coupon_id: string;
      coupons: CouponEmbed | null;
    };

    const { data: userCoupons } = await supabase
      .from("user_coupons")
      .select(
        "id, coupon_id, coupons(id, code, type, discount_value, max_discount_amount, end_date, is_active, start_date, scope, max_applicable_qty, usage_limit_per_user)",
      )
      .eq("user_id", user.id)
      .returns<UserCouponEmbedded[]>();

    const { data: usages } = await supabase
      .from("coupon_usages")
      .select("coupon_id")
      .eq("user_id", user.id);

    // Count usages per coupon (not binary — supports usage_limit_per_user > 1)
    const usageCountMap = new Map<string, number>();
    for (const u of usages ?? []) {
      usageCountMap.set(u.coupon_id, (usageCountMap.get(u.coupon_id) ?? 0) + 1);
    }
    const now = new Date();

    const activeCoupons: CouponData[] = (userCoupons ?? [])
      .filter((uc): uc is UserCouponEmbedded & { coupons: CouponEmbed } => uc.coupons !== null)
      .map((uc) => {
        const c = uc.coupons;
        const userUsageCount = usageCountMap.get(c.id) ?? 0;
        const perUserLimit = c.usage_limit_per_user ?? 1;
        let status: "active" | "used" | "expired" = "active";
        if (userUsageCount >= perUserLimit) {
          status = "used";
        } else if (c.end_date && parseAsUTC(c.end_date) < now) {
          status = "expired";
        } else if (!c.is_active) {
          status = "expired";
        }
        return {
          id: uc.id,
          coupon_id: c.id,
          code: c.code,
          type: c.type,
          discount_value: Number(c.discount_value),
          max_discount_amount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
          end_date: c.end_date,
          is_active: c.is_active,
          status,
          scope: c.scope || "all",
          scope_item_ids: [] as string[],
          max_applicable_qty: c.max_applicable_qty ? Number(c.max_applicable_qty) : null,
        };
      })
      .filter((c: CouponData) => c.status === "active");

    // Fetch scope items for scoped coupons. Group by scope table so we can
    // make one query per table with an `in()` over all coupon_ids — avoids
    // N round-trips when the user has many scoped coupons.
    const scopedByTable = new Map<
      string,
      { idField: string; couponIds: string[] }
    >();
    for (const coupon of activeCoupons) {
      if (!coupon.scope || coupon.scope === "all") continue;
      const table = SCOPE_TABLE_MAP[coupon.scope];
      const idField = SCOPE_ID_FIELD_MAP[coupon.scope];
      if (!table || !idField) continue;
      const bucket = scopedByTable.get(table);
      if (bucket) bucket.couponIds.push(coupon.coupon_id);
      else
        scopedByTable.set(table, {
          idField,
          couponIds: [coupon.coupon_id],
        });
    }

    if (scopedByTable.size > 0) {
      // Dynamic table name → opt out of typed-client narrowing.
      const untypedFrom = supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            in: (col: string, vals: string[]) => PromiseLike<{
              data: Array<Record<string, string>> | null;
            }>;
          };
        };
      };
      const tableQueries = await Promise.all(
        [...scopedByTable.entries()].map(async ([table, { idField, couponIds }]) => {
          const { data } = await untypedFrom
            .from(table)
            .select(`coupon_id, ${idField}`)
            .in("coupon_id", couponIds);
          return { idField, rows: data ?? [] };
        }),
      );

      // Build a per-coupon lookup of scope items.
      const scopeItemsByCoupon = new Map<string, string[]>();
      for (const { idField, rows } of tableQueries) {
        for (const row of rows) {
          const couponId = row.coupon_id;
          const itemId = row[idField];
          if (!couponId || !itemId) continue;
          const existing = scopeItemsByCoupon.get(couponId);
          if (existing) existing.push(itemId);
          else scopeItemsByCoupon.set(couponId, [itemId]);
        }
      }

      for (const coupon of activeCoupons) {
        if (coupon.scope && coupon.scope !== "all") {
          coupon.scope_item_ids =
            scopeItemsByCoupon.get(coupon.coupon_id) ?? [];
        }
      }
    }

    setCoupons(activeCoupons);
    setLoading(false);
  };

  const handleSelect = (coupon: CouponData) => {
    if (selectedCouponId === coupon.coupon_id) {
      onSelect(null);
    } else {
      onSelect(coupon);
    }
    onClose();
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200 mx-4 md:mx-0"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <PrimaryHeading>
            Купон ашиглах
          </PrimaryHeading>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer"
            aria-label="Close"
          >
            <Cancel />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[280px]">
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="h-[134px] skeleton rounded-lg" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex border border-dashed border-[#E2E8F0] rounded-lg h-[134px]">
              <div className="flex flex-col items-center justify-center gap-3 w-full">
                <div className="w-12 h-12 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                  <Coupon />
                </div>
                <p className="text-[#64748B] font-normal text-sm font-manrope text-center">
                  Ашиглах боломжтой купон алга байна
                </p>
              </div>
            </div>
          ) : (
            coupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                selectable
                selected={selectedCouponId === coupon.coupon_id}
                onClick={() => handleSelect(coupon)}
              />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
