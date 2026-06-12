"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CouponCard, type CouponData } from "@/components/profile/CouponCard";
import { Cancel, Coupon } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { useUserCoupons } from "./_coupon-select/_useUserCoupons";

interface CouponSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCouponId: string | null;
  onSelect: (coupon: CouponData | null) => void;
}

function useModalAnimation(isOpen: boolean) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- modal enter animation: mount, then double-RAF before applying transition
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
      return;
    }
    if (visible) {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, visible]);

  return { visible, animate };
}

function useEscapeKey(visible: boolean, onClose: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [visible, onClose]);
}

function EmptyState() {
  return (
    <div className="flex border border-dashed border-border rounded-lg h-[134px]">
      <div className="flex flex-col items-center justify-center gap-3 w-full">
        <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center">
          <Coupon />
        </div>
        <p className="text-text-secondary font-normal text-sm font-manrope text-center">
          Ашиглах боломжтой купон алга байна
        </p>
      </div>
    </div>
  );
}

interface CouponListProps {
  loading: boolean;
  coupons: CouponData[];
  selectedCouponId: string | null;
  onSelect: (coupon: CouponData) => void;
}

function CouponList({ loading, coupons, selectedCouponId, onSelect }: CouponListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-[134px] skeleton rounded-lg" />
      </div>
    );
  }
  if (coupons.length === 0) return <EmptyState />;
  return (
    <>
      {coupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          selectable
          selected={selectedCouponId === coupon.coupon_id}
          onClick={() => onSelect(coupon)}
        />
      ))}
    </>
  );
}

export const CouponSelectModal = ({
  isOpen,
  onClose,
  selectedCouponId,
  onSelect,
}: CouponSelectModalProps) => {
  const { visible, animate } = useModalAnimation(isOpen);
  const { coupons, loading, fetchCoupons } = useUserCoupons();

  useScrollLock(visible);
  useEscapeKey(visible, onClose);

  useEffect(() => {
    if (isOpen) fetchCoupons();
  }, [isOpen, fetchCoupons]);

  const handleSelect = (coupon: CouponData) => {
    onSelect(selectedCouponId === coupon.coupon_id ? null : coupon);
    onClose();
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[375px] bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-[opacity,transform] duration-200 mx-4 md:mx-0"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        <div className="flex items-center justify-between">
          <PrimaryHeading>Купон ашиглах</PrimaryHeading>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[280px]">
          <CouponList
            loading={loading}
            coupons={coupons}
            selectedCouponId={selectedCouponId}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};
