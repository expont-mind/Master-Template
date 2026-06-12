"use client";

import { SITE } from "@repo/config-site";
import { ChevronDown } from "lucide-react";

import { MPointBadge, MPointSmall } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";
import { BRAND } from "@/lib/utils/brand-config";
import { formatPrice } from "@/lib/utils/formatters";
import { useCartStore } from "@/stores/cart-store";

interface PointRowProps {
  pointBalance: number | null;
  pointDiscount: number;
  onOpenPointModal: () => void;
}

export function PointRow({ pointBalance, pointDiscount, onOpenPointModal }: PointRowProps) {
  const selectedPoints = useCartStore((s) => s.selectedPoints);
  const setSelectedPoints = useCartStore((s) => s.setSelectedPoints);

  if (!SITE.features.pointSystem) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <MutedText>{BRAND.name} point</MutedText>
        {selectedPoints ? (
          <button
            onClick={() => setSelectedPoints(null)}
            className="flex items-center gap-1 pl-3 h-6 pr-2 border border-border rounded-full cursor-pointer"
          >
            <span className="text-text-primary font-medium text-xs font-manrope">Болих</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M10.5 3.5L3.50047 10.4995M10.4995 10.5L3.5 3.50049"
                stroke="#94A3B8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={onOpenPointModal}
            className="flex items-center gap-1 pl-3 h-6 pr-2 border border-border rounded-full cursor-pointer"
          >
            <span className="text-text-primary font-medium text-xs font-manrope flex items-center gap-0.5">
              {pointBalance !== null && pointBalance > 0 ? (
                <>
                  Ашиглах - {pointBalance.toLocaleString()}{" "}
                  <span className="pb-[1.4px]">
                    <MPointSmall />
                  </span>
                </>
              ) : (
                "Сонгох"
              )}
            </span>
            <ChevronDown size={12} color="#94A3B8" />
          </button>
        )}
      </div>
      {pointDiscount > 0 ? (
        <div className="flex items-center text-brand-primary font-medium text-base font-manrope">
          -{pointDiscount.toLocaleString()} <MPointBadge className="ml-[2px]" />
        </div>
      ) : (
        <p className="text-slate-900 font-medium text-base font-manrope text-right">--</p>
      )}
    </div>
  );
}

interface CouponRowProps {
  couponDiscount: number;
  onOpenCouponModal: () => void;
}

export function CouponRow({ couponDiscount, onOpenCouponModal }: CouponRowProps) {
  const selectedCoupon = useCartStore((s) => s.selectedCoupon);

  if (!SITE.features.coupons) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <MutedText>Миний купон</MutedText>
        <button
          onClick={onOpenCouponModal}
          className="flex items-center gap-1 pl-3 h-6 pr-2 border border-border rounded-full cursor-pointer"
        >
          <span className="text-text-primary font-medium text-xs font-manrope">
            {selectedCoupon
              ? `${selectedCoupon.code} - ${selectedCoupon.type === "percentage" ? `${selectedCoupon.discount_value}%` : formatPrice(selectedCoupon.discount_value)}`
              : "Сонгох"}
          </span>
          <ChevronDown size={12} color="#94A3B8" />
        </button>
      </div>
      {couponDiscount > 0 ? (
        <p className="text-brand-primary font-medium text-base font-manrope">
          -{formatPrice(couponDiscount)}
        </p>
      ) : (
        <p className="text-slate-900 font-medium text-base font-manrope text-right">--</p>
      )}
    </div>
  );
}
