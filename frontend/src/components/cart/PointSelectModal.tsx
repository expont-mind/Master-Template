"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { createClient } from "@/lib/supabase/client";
import { MPointLogo, PointText } from "@/components/svg";

interface PointSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (points: number | null) => void;
}

export const PointSelectModal = ({
  isOpen,
  onClose,
  onSelect,
}: PointSelectModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [balance, setBalance] = useState(0);
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
      fetchBalance();
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

  const fetchBalance = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const db = supabase as any;
    const { data } = await db
      .from("point_transactions")
      .select("amount")
      .eq("user_id", user.id);

    const total = (data ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + t.amount,
      0,
    );
    setBalance(total);
    setLoading(false);
  };

  const handleUse = () => {
    if (balance > 0) {
      onSelect(balance);
    }
    onClose();
  };

  const handleCancel = () => {
    onSelect(null);
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
        className="relative w-full max-w-[375px] bg-slate-50 border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] px-6 pt-8 pb-6 flex flex-col gap-4 transition-all duration-200 mx-4 md:mx-0"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Balance Card */}
        {loading ? (
          <div className="bg-white rounded-xl h-[100px] skeleton" />
        ) : (
          <div className="bg-white rounded-xl px-5 pb-6 pt-5 flex items-start justify-between shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-2">
              <p className="text-[#64748B] font-normal text-sm font-manrope px-0.5">
                Дансны үлдэгдэл
              </p>
              <p className="text-[#020617] font-bold text-4xl font-manrope leading-7">
                {balance.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1.5">
              <MPointLogo />
              <PointText />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-[10px] w-full">
          <button
            onClick={handleCancel}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm cursor-pointer text-[#020617] font-normal text-base font-manrope hover:bg-[#F8FAFC] transition-colors duration-200"
          >
            Болих
          </button>
          <button
            onClick={handleUse}
            disabled={balance <= 0 || loading}
            className={`flex w-full items-center justify-center px-3 py-2.5 h-11 rounded-sm font-normal text-base font-manrope transition-colors duration-200 ${
              balance > 0 && !loading
                ? "bg-[#020617] text-white cursor-pointer hover:bg-[#1E293B]"
                : "bg-[rgba(2,6,23,0.30)] text-white cursor-not-allowed"
            }`}
          >
            Ашиглах
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
