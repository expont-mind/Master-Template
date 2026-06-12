"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

import { MPointLogo, PointText } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { createClient } from "@/lib/supabase/client";

interface PointSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (points: number | null) => void;
}

export const PointSelectModal = ({ isOpen, onClose, onSelect }: PointSelectModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useScrollLock(visible);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("point_transactions")
      .select("amount")
      .eq("user_id", user.id);

    const total = (data ?? []).reduce((sum, t) => sum + t.amount, 0);
    setBalance(total);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Defer mount/animate/fetch to a paint tick so React doesn't see a
      // synchronous setState in the effect body. Two RAFs guarantees the
      // element has been painted in its initial state before the visible
      // class is applied.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setVisible(true);
        fetchBalance();
        raf2 = requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    if (visible) {
      const raf = requestAnimationFrame(() => setAnimate(false));
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 200);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timeout);
      };
    }
    return undefined;
  }, [isOpen, visible, fetchBalance]);

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
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-slate-50 border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] px-6 pt-8 pb-6 flex flex-col gap-4 transition-[opacity,transform] duration-200 mx-4 md:mx-0"
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
              <p className="text-text-secondary font-normal text-sm font-manrope px-0.5">
                Дансны үлдэгдэл
              </p>
              <p className="text-text-primary font-bold text-4xl font-manrope leading-7">
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
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200"
          >
            Болих
          </button>
          <button
            onClick={handleUse}
            disabled={balance <= 0 || loading}
            className={`flex w-full items-center justify-center px-3 py-2.5 h-11 rounded-sm font-normal text-base font-manrope transition-colors duration-200 ${
              balance > 0 && !loading
                ? "bg-text-primary text-white cursor-pointer hover:bg-surface-dark"
                : "bg-text-primary/30 text-white cursor-not-allowed"
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
