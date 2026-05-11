"use client";

import { useState, useEffect, useCallback } from "react";
import { Coupon, Plus, Slash } from "../svg";
import Link from "next/link";
import { CouponCard, type CouponData } from "./CouponCard";
import { AddCouponModal } from "./AddCouponModal";
import { createClient } from "@/lib/supabase/client";
import { parseAsUTC } from "@/lib/utils/formatters";

const tabs = ["Идэвхтэй", "Ашигласан", "Эрх дууссан"] as const;

type CouponStatus = "active" | "used" | "expired";

const tabStatusMap: Record<number, CouponStatus> = {
  0: "active",
  1: "used",
  2: "expired",
};

interface CouponContentProps {
  onCouponCountChange?: (count: number) => void;
}

const SCOPE_JUNCTION: Record<
  string,
  { table: string; idField: string; refTable: string }
> = {
  product: {
    table: "coupon_products",
    idField: "product_id",
    refTable: "products",
  },
  category: {
    table: "coupon_categories",
    idField: "category_id",
    refTable: "categories",
  },
  brand: { table: "coupon_brands", idField: "brand_id", refTable: "brands" },
};

export const CouponContent = ({ onCouponCountChange }: CouponContentProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCoupons = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch user's claimed coupons with coupon details
    const { data: userCoupons } = await supabase
      .from("user_coupons")
      .select(
        "id, coupon_id, coupons(id, code, type, discount_value, max_discount_amount, end_date, is_active, start_date, scope, max_applicable_qty, usage_limit_per_user)",
      )
      .eq("user_id", user.id);

    // Fetch user's coupon usages to know which are "used"
    const { data: usages } = await supabase
      .from("coupon_usages")
      .select("coupon_id")
      .eq("user_id", user.id);

    const usageCountMap = new Map<string, number>();
    for (const u of usages ?? []) {
      usageCountMap.set(u.coupon_id, (usageCountMap.get(u.coupon_id) ?? 0) + 1);
    }
    const now = new Date();

    type UserCouponRow = NonNullable<typeof userCoupons>[number];

    const mapped: CouponData[] = (userCoupons ?? [])
      .filter((uc): uc is UserCouponRow & { coupons: NonNullable<UserCouponRow["coupons"]> } => uc.coupons !== null)
      .map((uc) => {
        const c = uc.coupons;
        const userUsageCount = usageCountMap.get(c.id) ?? 0;
        const perUserLimit = c.usage_limit_per_user ?? 1;
        let status: CouponStatus = "active";

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
          max_discount_amount: c.max_discount_amount
            ? Number(c.max_discount_amount)
            : null,
          end_date: c.end_date,
          is_active: c.is_active,
          status,
          scope: c.scope || "all",
          scope_item_names: [] as string[],
          max_applicable_qty: c.max_applicable_qty
            ? Number(c.max_applicable_qty)
            : null,
        };
      });

    // Fetch scope item names for scoped coupons (batch by scope type).
    // `config.table`/`refTable` are runtime strings, so this query is
    // intentionally untyped at the table boundary; result rows are
    // narrowed to a Record shape.
    type JunctionRow = { coupon_id: string } & Record<string, { name?: string } | string>;
    const untypedFrom = supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          in: (col: string, vals: string[]) => PromiseLike<{ data: JunctionRow[] | null }>;
        };
      };
    };

    for (const [scopeType, config] of Object.entries(SCOPE_JUNCTION)) {
      const scopedCoupons = mapped.filter((c) => c.scope === scopeType);
      if (scopedCoupons.length === 0) continue;

      const couponIds = scopedCoupons.map((c) => c.coupon_id);
      const { data: junctions } = await untypedFrom
        .from(config.table)
        .select(`coupon_id, ${config.idField}, ${config.refTable}(name)`)
        .in("coupon_id", couponIds);

      for (const c of scopedCoupons) {
        const items = (junctions ?? []).filter(
          (j) => j.coupon_id === c.coupon_id,
        );
        c.scope_item_names = items
          .map((j) => {
            const ref = j[config.refTable];
            return typeof ref === "object" && ref !== null ? ref.name : undefined;
          })
          .filter((n): n is string => Boolean(n));
      }
    }

    setCoupons(mapped);
    onCouponCountChange?.(mapped.filter((c) => c.status === "active").length);
    setLoading(false);
  }, [onCouponCountChange]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const filteredCoupons = coupons.filter(
    (coupon) => coupon.status === tabStatusMap[activeTab],
  );

  const getTabCount = (tabIndex: number) =>
    coupons.filter((coupon) => coupon.status === tabStatusMap[tabIndex]).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 pb-3">
          <div className="h-7 w-40 skeleton rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 skeleton rounded-full" />
            <div className="h-8 w-24 skeleton rounded-full" />
            <div className="h-8 w-28 skeleton rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-4">
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />

          <p className="text-slate-950 text-sm font-normal font-manrope">
            Миний купон
          </p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Миний купон
        </p>
      </div>

      <div className="flex gap-2 items-start -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveTab(index)}
            className={`h-8 px-4 rounded-full text-sm border font-manrope font-normal cursor-pointer transition-colors shrink-0 ${
              index === activeTab
                ? "bg-[#020617] border-[#020617] text-white font-medium"
                : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            {tab} ({getTabCount(index)})
          </button>
        ))}
      </div>

      {/* Coupons */}
      <div className="flex flex-col gap-3">
        {filteredCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-10">
            <div className="flex flex-col items-center justify-center">
              <div className="p-[9px]">
                <Coupon />
              </div>
              <p className="text-[#64748B] font-normal text-base font-manrope">
                Одоогоор купон алга байна
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center px-3 py-2.5 gap-0.5 text-[#020617] font-normal text-base font-manrope cursor-pointer"
            >
              <Plus />
              <span className="underline underline-offset-4 decoration-[0.96px] px-0.5">
                Купон нэмэх
              </span>
            </button>
          </div>
        ) : (
          <>
            {filteredCoupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
            {activeTab === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center px-3 mt-7 py-2.5 gap-0.5 text-[#020617] font-normal text-base font-manrope cursor-pointer"
              >
                <Plus />
                <span className="underline underline-offset-4 decoration-[0.96px] px-0.5">
                  Купон нэмэх
                </span>
              </button>
            )}
          </>
        )}
      </div>

      <AddCouponModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchCoupons}
      />
    </div>
  );
};
