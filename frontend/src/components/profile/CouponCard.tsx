"use client";

import { Check } from "lucide-react";
import { Calendar, CouponPercent, CouponFixed, DiscountTag } from "../svg";
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
    textColor: "text-[#0D9488]",
    bgColor: "bg-[#F0FDFA]",
  },
  used: {
    label: "Ашигласан",
    textColor: "text-[#94A3B8]",
    bgColor: "bg-[#F1F5F9]",
  },
  expired: {
    label: "Эрх дууссан",
    textColor: "text-[#94A3B8]",
    bgColor: "bg-[#F1F5F9]",
  },
};

interface CouponCardProps {
  coupon: CouponData;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
}

export const CouponCard = ({
  coupon,
  selected = false,
  selectable = false,
  onClick,
}: CouponCardProps) => {
  const Icon = coupon.type === "percentage" ? CouponPercent : CouponFixed;
  const status = statusConfig[coupon.status];

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={`relative flex border rounded-lg overflow-hidden transition-colors ${
        selectable ? "cursor-pointer" : ""
      } ${selected ? "border-[#020617] bg-white" : "border-[#E2E8F0] bg-white"}`}
    >
      {/* Left content */}
      <div className="flex-1 flex gap-4 p-4 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-[#F8FAFC] flex items-center justify-center shrink-0">
          <Icon />
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-col">
            <p className="text-[#020617] font-bold text-base font-manrope">
              {getCouponTitle(coupon.type, coupon.discount_value)}
            </p>
            <p className="text-[#020617] font-normal text-sm py-0.5 font-manrope truncate">
              Купон код: {coupon.code}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {coupon.end_date && (
              <>
                <div className="flex items-center gap-1">
                  <Calendar />
                  <span className="text-[#64748B] font-normal text-xs font-manrope">
                    {formatCouponDate(coupon.end_date)} -нд дуусна
                  </span>
                </div>
                <span className="text-[#64748B] text-xs mx-1">·</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <DiscountTag />
              <span className="text-[#64748B] font-normal text-xs font-manrope">
                {getDiscountLabel(coupon.type, coupon.discount_value)}
              </span>
            </div>
            {coupon.scope && coupon.scope !== "all" && (
              <>
                <span className="text-[#64748B] text-xs mx-1">·</span>
                <span className="text-[#64748B] font-normal text-xs font-manrope">
                  {coupon.scope_item_names && coupon.scope_item_names.length > 0
                    ? coupon.scope_item_names.join(", ")
                    : coupon.scope === "product"
                      ? "Тодорхой бүтээгдэхүүнд"
                      : coupon.scope === "category"
                        ? "Тодорхой ангилалд"
                        : "Тодорхой брэнд-д"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dashed divider */}
      {selectable ? null : (
        <div className="border-l border-dashed border-[#E2E8F0]" />
      )}

      {/* Right: status badge or checkmark */}
      {selectable ? (
        selected ? (
          <div className="flex items-center justify-center pl-4 pr-6 shrink-0">
            <Check size={24} color="#020617" />
          </div>
        ) : (
          <div className="flex items-center justify-center pl-4 pr-6 shrink-0">
            <div className="w-6 h-6" />
          </div>
        )
      ) : (
        <div className="flex items-center justify-center px-4 shrink-0">
          <span
            className={`text-xs font-medium font-manrope px-1.5 pb-1 pt-0.5 rounded-full whitespace-nowrap ${status.textColor} ${status.bgColor}`}
          >
            {status.label}
          </span>
        </div>
      )}
    </div>
  );
};
