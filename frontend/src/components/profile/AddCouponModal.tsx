"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { createClient } from "@/lib/supabase/client";
import { Cancel, Coupon } from "../svg";

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SuccessInfo {
  code: string;
  label: string;
}

function getCouponLabel(type: string, value: number): string {
  if (type === "percentage") return `${value}% -н купон`;
  if (type === "fixed") return `${value.toLocaleString()}₮ -н купон`;
  return "Үнэгүй хүргэлт купон";
}

export const AddCouponModal = ({
  isOpen,
  onClose,
  onSuccess,
}: AddCouponModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setCode("");
      setError(null);
      setSuccessInfo(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
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
      if (e.key === "Escape") {
        if (successInfo) {
          handleSuccessClose();
        } else {
          onClose();
        }
      }
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose, successInfo]);

  const handleSuccessClose = () => {
    onSuccess();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError("Купон код оруулна уу");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Нэвтэрч орно уу");
        setLoading(false);
        return;
      }

      // Tables not in frontend TS types — use untyped access
      const db = supabase as any;

      // Find coupon by code
      const { data: coupon, error: couponError } = await db
        .from("coupons")
        .select(
          "id, code, type, discount_value, is_active, start_date, end_date, usage_limit, usage_count",
        )
        .eq("code", trimmedCode)
        .maybeSingle();

      if (couponError || !coupon) {
        setError("Купон код буруу байна");
        setLoading(false);
        return;
      }

      // Check if already claimed
      const { data: existing } = await db
        .from("user_coupons")
        .select("id")
        .eq("user_id", user.id)
        .eq("coupon_id", coupon.id)
        .maybeSingle();

      if (existing) {
        setError("Та энэ купоныг аль хэдийн нэмсэн байна");
        setLoading(false);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        setError("Купоны ашиглалтын хязгаар дууссан байна");
        setLoading(false);
        return;
      }

      // Claim the coupon
      const { error: insertError } = await db.from("user_coupons").insert({
        user_id: user.id,
        coupon_id: coupon.id,
      });

      if (insertError) {
        setError("Купон нэмэхэд алдаа гарлаа");
        setLoading(false);
        return;
      }

      setSuccessInfo({
        code: coupon.code,
        label: getCouponLabel(coupon.type, Number(coupon.discount_value)),
      });
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу");
    } finally {
      setLoading(false);
    }
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={successInfo ? handleSuccessClose : onClose}
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
        {successInfo ? (
          /* Success State */
          <div className="flex flex-col items-center gap-8 py-2">
            <div className="w-14 h-14 rounded-full bg-[#CCFBF1] flex items-center justify-center">
              <div className="text-[#14B8A6]">
                <Coupon />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[#020617] font-semibold text-xl font-manrope">
                Амжилттай нэмэгдлээ
              </p>
              <p className="text-[#64748B] font-normal text-base font-manrope text-center">
                {successInfo.code} кодтой {successInfo.label}
                <br />
                амжилттай нэмэгдлээ
              </p>
            </div>
            <button
              onClick={handleSuccessClose}
              className="w-full max-w-[120px] py-2.5 px-3 rounded-sm font-normal text-base font-manrope bg-[#020617] text-white cursor-pointer hover:bg-[#1E293B] transition-colors duration-200"
            >
              Ок
            </button>
          </div>
        ) : (
          /* Input State */
          <>
            <div className="flex items-center justify-between">
              <p className="text-[#020617] font-semibold text-xl font-manrope">
                Купон нэмэх
              </p>
              <button
                onClick={onClose}
                className="p-1 cursor-pointer"
                aria-label="Close"
              >
                <Cancel />
              </button>
            </div>

            {/* Input */}
            <div className="flex flex-col gap-0.5">
              <label
                htmlFor="delivery-address"
                className="text-text-primary font-normal text-sm leading-5 font-manrope"
              >
                Купон код
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="Купон кодоо оруулна уу"
                className={`w-full h-12 pl-3 pr-0.5 bg-white border ${error ? "border-accent-rose" : "border-border"} placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200`}
              />
              {error && (
                <p className="text-accent-rose text-xs font-manrope mt-0.5">
                  {error}
                </p>
              )}
            </div>

            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !code.trim()}
              className={`w-full py-2.5 px-3 rounded-sm font-normal text-base font-manrope transition-colors duration-200 ${
                loading || !code.trim()
                  ? "bg-[rgba(2,6,23,0.30)] text-white cursor-not-allowed"
                  : "bg-[#020617] text-white cursor-pointer hover:bg-[#1E293B]"
              }`}
            >
              {loading ? "Шалгаж байна..." : "Нэмэх"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
