"use client";

import { Check } from "lucide-react";

import { Calendar, CouponPercent, CouponFixed, DiscountTag } from "@/components/svg";
import { parseAsUTC } from "@/lib/utils/formatters";

export interface CouponData {
  id: string;
  coupon_id: string;
  code: string;
  type: "fixed" | "percentage" | "free_shipping";
  discount_value: number;
  max_discount_amount: number | null;
  end_date: string | null;
  is_active: boolean;
  status: "active" | "used" | "expired";
  scope?: string;
  scope_item_ids?: string[];
  scope_item_names?: string[];
  max_applicable_qty?: number | null;
}

function formatCouponDate(date: string | null): string {
  if (!date) return "";
  return parseAsUTC(date)
    .toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" })
    .replace(/-/g, ".");
}

function getCouponTitle(type: string, value: number): string {
  if (type === "percentage") return `${value}% -н купон`;
  if (type === "fixed") return `${value.toLocaleString()}₮ -н купон`;
  return "Хүргэлтийн купон";
}

function getDiscountLabel(type: string, value: number): string {
  if (type === "percentage") return `${value}% -н хямдрал`;
  if (type === "fixed") return `${value.toLocaleString()}₮ -н хямдрал`;
  return "Үнэгүй хүргэлт";
}

const statusConfig: Record<
  CouponData["status"],
  { label: string; textColor: string; bgColor: string }
> = {
  active: {
    label: "Идэвхтэй",
    textColor: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  used: {
    label: "Ашигласан",
    textColor: "text-text-muted",
    bgColor: "bg-border-light",
  },
  expired: {
    label: "Эрх дууссан",
    textColor: "text-text-muted",
    bgColor: "bg-border-light",
  },
};

function getScopeFallbackLabel(scope: string): string {
  if (scope === "product") return "Тодорхой бүтээгдэхүүнд";
  if (scope === "category") return "Тодорхой ангилалд";
  return "Тодорхой брэнд-д";
}

function getScopeLabel(coupon: CouponData): string | null {
  if (!coupon.scope || coupon.scope === "all") return null;
  const names = coupon.scope_item_names;
  if (names && names.length > 0) return names.join(", ");
  return getScopeFallbackLabel(coupon.scope);
}

function renderRightCell(
  selectable: boolean,
  selected: boolean,
  status: { label: string; textColor: string; bgColor: string },
) {
  if (selectable) {
    return (
      <div className="flex items-center justify-center pl-4 pr-6 shrink-0">
        {selected ? <Check size={24} color="#020617" /> : <div className="w-6 h-6" />}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center px-4 shrink-0">
      <span
        className={`text-xs font-medium font-manrope px-1.5 pb-1 pt-0.5 rounded-full whitespace-nowrap ${status.textColor} ${status.bgColor}`}
      >
        {status.label}
      </span>
    </div>
  );
}

interface CouponCardProps {
  coupon: CouponData;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
}

function CouponCardBody({
  coupon,
  selected,
  selectable,
  status,
  scopeLabel,
}: {
  coupon: CouponData;
  selected: boolean;
  selectable: boolean;
  status: { label: string; textColor: string; bgColor: string };
  scopeLabel: string | null;
}) {
  const Icon = coupon.type === "percentage" ? CouponPercent : CouponFixed;
  return (
    <>
      {/* Left content */}
      <div className="flex-1 flex gap-4 p-4 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center shrink-0">
          <Icon />
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-col">
            <p className="text-text-primary font-bold text-base font-manrope">
              {getCouponTitle(coupon.type, coupon.discount_value)}
            </p>
            <p className="text-text-primary font-normal text-sm py-0.5 font-manrope truncate">
              Купон код: {coupon.code}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {coupon.end_date && (
              <>
                <div className="flex items-center gap-1">
                  <Calendar />
                  <span className="text-text-secondary font-normal text-xs font-manrope">
                    {formatCouponDate(coupon.end_date)} -нд дуусна
                  </span>
                </div>
                <span className="text-text-secondary text-xs mx-1">·</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <DiscountTag />
              <span className="text-text-secondary font-normal text-xs font-manrope">
                {getDiscountLabel(coupon.type, coupon.discount_value)}
              </span>
            </div>
            {scopeLabel && (
              <>
                <span className="text-text-secondary text-xs mx-1">·</span>
                <span className="text-text-secondary font-normal text-xs font-manrope">
                  {scopeLabel}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {!selectable && <div className="border-l border-dashed border-border" />}
      {renderRightCell(selectable, selected, status)}
    </>
  );
}

export const CouponCard = ({
  coupon,
  selected = false,
  selectable = false,
  onClick,
}: CouponCardProps) => {
  const status = statusConfig[coupon.status];
  const scopeLabel = getScopeLabel(coupon);
  const borderClass = selected ? "border-text-primary" : "border-border";
  const baseClassName = `relative flex border rounded-lg overflow-hidden transition-colors ${borderClass} bg-white`;
  const body = (
    <CouponCardBody
      coupon={coupon}
      selected={selected}
      selectable={selectable}
      status={status}
      scopeLabel={scopeLabel}
    />
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left cursor-pointer ${baseClassName}`}
      >
        {body}
      </button>
    );
  }
  return <div className={baseClassName}>{body}</div>;
};
