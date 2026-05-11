"use client";

import { LOCALE } from "@/lib/utils/brand-config";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { useWishlistStore } from "@/stores/wishlist-store";
import {
  Heart,
  Cancel,
  Facebook,
  Google,
  Apple,
  Slash,
} from "@/components/svg";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/supabase/auth-helpers";
import type { User as SupabaseUser, Provider } from "@supabase/supabase-js";
import { ClearWishlistModal } from "@/components/wishlist/ClearWishlistModal";
import type { Product } from "@/types/database";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const isHydrated = useWishlistStore((s) => s.isHydrated);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const insertItemAt = useWishlistStore((s) => s.insertItemAt);
  const router = useRouter();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [removedProduct, setRemovedProduct] = useState<{
    product: Product;
    index: number;
  } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const OTP_COOLDOWN = 90;
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevItemsRef = useRef<Product[]>(items);
  const snackbarTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef(0);

  // Detect when an item is removed from wishlist
  useEffect(() => {
    const prevItems = prevItemsRef.current;
    prevItemsRef.current = items;

    if (prevItems.length > items.length) {
      const removedIndex = prevItems.findIndex(
        (prev) => !items.some((curr) => curr.id === prev.id),
      );
      if (removedIndex !== -1) {
        if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
        setRemovedProduct({
          product: prevItems[removedIndex],
          index: removedIndex,
        });
        setSnackbarVisible(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSnackbarVisible(true);
          });
        });
        snackbarTimerRef.current = setTimeout(() => {
          setSnackbarVisible(false);
          setTimeout(() => setRemovedProduct(null), 500);
        }, 3000);
      }
    }
  }, [items]);

  const handleUndo = useCallback(() => {
    if (!removedProduct) return;
    insertItemAt(removedProduct.product, removedProduct.index);
    setSnackbarVisible(false);
    setTimeout(() => setRemovedProduct(null), 300);
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
  }, [removedProduct, insertItemAt]);

  const dismissSnackbar = useCallback(() => {
    setSnackbarVisible(false);
    setDragY(0);
    setIsDragging(false);
    setTimeout(() => setRemovedProduct(null), 300);
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dragStartRef.current = e.clientY;
      setIsDragging(true);
      setDragY(0);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const delta = e.clientY - dragStartRef.current;
      setDragY(delta);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    if (Math.abs(dragY) > 60) {
      dismissSnackbar();
    } else {
      setDragY(0);
    }
    setIsDragging(false);
  }, [isDragging, dragY, dismissSnackbar]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith(LOCALE.phoneCountryCode)) return `+${digits}`;
    return `+${LOCALE.phoneCountryCode}${digits}`;
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Зөв утасны дугаар оруулна уу");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setOtp(["", "", "", "", "", ""]);
    setStep("otp");
    setCountdown(OTP_COOLDOWN);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: code,
      type: "sms",
    });
    setLoading(false);
    if (verifyError) {
      setError("Код буруу байна. Дахин оруулна уу.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    // iOS autofill: full OTP code received at once
    if (digits.length > 1) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < Math.min(digits.length, 6); i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      setError("");
      const nextIndex = Math.min(digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      if (digits.length >= 6) {
        handleVerifyOtp(digits.slice(0, 6));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);
    setError("");
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
    const code = newOtp.join("");
    if (code.length === 6) handleVerifyOtp(code);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
    if (pasted.length === 6) handleVerifyOtp(pasted);
  };

  const handleSocialLogin = async (provider: Provider) => {
    const supabase = createClient();
    const redirectTo = getAuthCallbackUrl("/wishlist");
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };

  // Loading skeleton
  if (!isHydrated || !authChecked) {
    return (
      <div className="w-full bg-white flex justify-center min-h-screen">
        <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
          <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
            Хадгалсан
          </p>
          <div className="flex items-center justify-between pt-1.5 pb-5">
            <div className="h-5 w-32 skeleton" />
            <div className="h-4 w-36 skeleton" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 w-full">
                <div className="w-full h-[340px] rounded-[4px] skeleton" />
                <div className="space-y-2">
                  <div className="h-9 skeleton" />
                  <div className="h-12 skeleton" />
                  <div className="h-6 w-24 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated — show login prompt
  if (!user) {
    return (
      <div className="w-full bg-white flex justify-center min-h-screen">
        <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
          <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
            Хадгалсан
          </p>

          <div className="flex flex-col gap-7 pt-4 pb-10">
            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-[88px]">
              {/* Left side — heart icon + text */}
              <div className="max-w-[392px] w-full flex flex-col items-center justify-center gap-4">
                <div className="py-2">
                  <Heart />
                </div>
                <p className="text-[#64748B] font-normal text-base font-manrope text-center leading-6">
                  Нэвтэрснээр бүтээгдэхүүн
                  <br />
                  хадгалах боломжтой.
                </p>
              </div>

              {/* Right side — inline login form */}
              <div className="w-full max-w-[375px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-3.5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-[#020617] font-semibold text-xl font-manrope">
                    Нэвтрэх
                  </p>
                  <button
                    onClick={() => router.back()}
                    className="p-1 cursor-pointer"
                    aria-label="Хаах"
                  >
                    <Cancel />
                  </button>
                </div>

                {step === "phone" ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-[22px]">
                      {/* Phone Input */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[#020617] font-normal text-sm font-manrope">
                          Утас
                        </label>
                        <div className="h-12 flex items-center border border-[#E2E8F0] rounded-sm overflow-hidden focus-within:border-[#020617] transition-colors group">
                          <span className="px-3 text-[#64748B] h-full flex items-center text-base font-medium font-manrope select-none border-r border-[#E2E8F0] group-focus-within:border-r-[#020617] transition-colors">
                            +976
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            placeholder="Энд оруулна уу"
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 8);
                              setPhone(val);
                              setError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSendOtp();
                            }}
                            className="flex-1 px-3 py-3 outline-none text-[#020617] text-sm font-normal font-manrope placeholder:text-[#64748B]"
                          />
                        </div>
                        {error && (
                          <p className="text-[#F43F5E] font-normal text-sm font-manrope">
                            {error}
                          </p>
                        )}
                      </div>

                      {/* Continue Button */}
                      <button
                        onClick={handleSendOtp}
                        disabled={loading}
                        className={`w-full py-2.5 px-3 rounded-sm text-white font-normal text-base font-manrope transition-colors duration-200 ${
                          phone.length >= 8
                            ? "bg-[#020617] cursor-pointer hover:bg-[#1E293B]"
                            : "bg-[rgba(2,6,23,0.30)] cursor-not-allowed"
                        }`}
                      >
                        {loading ? "Илгээж байна..." : "Үргэлжлүүлэх"}
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-[#E2E8F0]" />
                      <span className="text-[#64748B] font-medium text-xs font-manrope">
                        Эсвэл
                      </span>
                      <div className="flex-1 h-px bg-[#E2E8F0]" />
                    </div>

                    {/* Social Login Buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleSocialLogin("facebook")}
                        className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200"
                      >
                        <Facebook />

                        <span className="text-[#475569] font-normal text-base font-manrope flex-1">
                          Facebook-р нэвтрэх
                        </span>
                      </button>

                      <button
                        onClick={() => handleSocialLogin("google")}
                        className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200"
                      >
                        <Google />

                        <span className="text-[#475569] font-normal text-base font-manrope flex-1">
                          Google-р нэвтрэх
                        </span>
                      </button>

                      {/* <button
                        onClick={() => handleSocialLogin("apple")}
                        className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200"
                      >
                        <Apple />

                        <span className="text-[#475569] font-normal text-base font-manrope flex-1">
                          Apple-р нэвтрэх
                        </span>
                      </button> */}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {/* OTP description */}
                    <p className="text-[#020617] font-normal text-base font-manrope leading-6">
                      {phone} дугаар руу 6 оронтой код илгээлээ.
                    </p>

                    {/* OTP Inputs */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[#020617] font-medium text-sm font-manrope">
                        Баталгаажуулах код
                      </label>
                      <div
                        className="flex items-center justify-center gap-3"
                        onPaste={handleOtpPaste}
                      >
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              otpRefs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            {...(i !== 0 && { maxLength: 1 })}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className="w-11 h-11 text-center text-lg font-semibold font-manrope text-[#020617] border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#020617] transition-colors"
                          />
                        ))}
                      </div>
                      {error && (
                        <p className="text-[#F43F5E] font-normal text-sm font-manrope text-center">
                          {error}
                        </p>
                      )}
                    </div>

                    {loading && (
                      <p className="text-[#64748B] font-normal text-sm font-manrope text-center">
                        Шалгаж байна...
                      </p>
                    )}

                    {/* Countdown / Expired message */}
                    {!loading && countdown > 0 && (
                      <p className="text-[#64748B] font-normal text-sm font-manrope text-center">
                        Код хүчинтэй: {countdown}с
                      </p>
                    )}
                    {!loading && countdown === 0 && step === "otp" && (
                      <p className="text-[#F43F5E] font-normal text-sm font-manrope text-center">
                        Кодын хугацаа дууслаа. Дахин илгээнэ үү.
                      </p>
                    )}

                    {/* Resend / Change phone */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => {
                          setStep("phone");
                          setOtp(["", "", "", "", "", ""]);
                          setError("");
                          setCountdown(0);
                        }}
                        className="text-[#64748B] font-normal text-sm font-manrope underline cursor-pointer hover:text-[#020617] transition-colors duration-200"
                      >
                        Дугаар солих
                      </button>
                      <button
                        onClick={handleSendOtp}
                        disabled={loading || countdown > 0}
                        className="text-[#020617] font-medium text-sm font-manrope underline cursor-pointer hover:text-[#64748B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {countdown > 0
                          ? `Дахин илгээх (${countdown}с)`
                          : "Дахин илгээх"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty wishlist (authenticated)
  if (items.length === 0 && !removedProduct) {
    return (
      <div className="w-full bg-white flex justify-center min-h-screen">
        <div className="flex flex-col items-center max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
          <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope w-full">
            Хадгалсан
          </p>

          <div className="pt-7 flex flex-col gap-8 md:gap-[88px] w-full">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1">
                <p className="text-[#020617] font-black text-base font-manrope">
                  {items.length}
                </p>
                <p className="text-[#020617] font-medium text-base font-manrope">
                  Бүтээгдэхүүн
                </p>
              </div>
              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="py-2">
                  <Heart />
                </div>
                <p className="text-[#64748B] font-normal text-base font-manrope">
                  Одоогоор бүтээгдэхүүн хадгалаагүй байна
                </p>
              </div>

              <Link
                href="/products"
                className="px-3 max-w-[154px] w-full h-10 py-1 flex items-center justify-center rounded-sm border border-[#E2E8F0] text-[#020617] font-normal text-sm font-manrope transition-colors duration-200 hover:bg-surface"
              >
                Дэлгүүр хэсэх
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wishlist with items
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        <div className="px-0.5 pb-0 md:pb-2 pt-5 md:pt-[52px]">
          <div className="items-center gap-1.5 flex md:hidden">
            <Link href="/profile">
              <p className="text-[#64748B] font-normal text-sm font-manrope">
                Профайл
              </p>
            </Link>
            <Slash />
            <p className="text-[#020617] font-normal text-sm font-manrope">
              Хадгалсан
            </p>
          </div>
          <p className="text-[#020617] font-bold text-2xl md:text-xl md:text-[26px] leading-9 font-manrope">
            Хадгалсан
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <div className="items-center justify-between pb-4 hidden md:flex">
            <div className="flex items-center gap-1">
              <p className="text-[#020617] font-black text-base font-manrope">
                {items.length}
              </p>
              <p className="text-[#020617] font-medium text-base font-manrope">
                Бүтээгдэхүүн
              </p>
            </div>
            <button
              onClick={() => setShowClearModal(true)}
              className="text-[#64748B] font-medium text-sm font-manrope underline underline-offset-2 cursor-pointer hover:text-[#020617] transition-colors duration-200 whitespace-nowrap"
            >
              Хадгалсан цэвэрлэх
            </button>
          </div>

          <div className="py-2 hidden md:block">
            <div className="w-full h-px bg-[#E2E8F0]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} fillParent />
            ))}
          </div>
        </div>
      </div>

      <ClearWishlistModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => {
          clearWishlist();
          setShowClearModal(false);
        }}
      />

      {/* Undo snackbar */}
      {removedProduct && (
        <div className="fixed z-50 bottom-5 left-1/2 -translate-x-1/2 md:bottom-auto md:top-[136px] md:left-auto md:translate-x-0 md:right-[calc((100vw-1064px)/2)]">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={
              isDragging
                ? {
                    transform: `translateY(${dragY}px)`,
                    opacity: Math.max(0, 1 - Math.abs(dragY) / 120),
                    transition: "none",
                  }
                : undefined
            }
            className={`touch-none select-none cursor-grab active:cursor-grabbing ${
              !isDragging
                ? `transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    snackbarVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-[calc(100%+40px)] md:-translate-y-[calc(100%+152px)] opacity-0"
                  }`
                : ""
            }`}
          >
            <div className="flex items-center gap-1.5 bg-white rounded-[10px] border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 min-w-[320px] md:w-[356px]">
              <p className="text-[#020617] font-medium text-sm font-manrope whitespace-nowrap flex-1">
                Хадгалсан -аас хасагдлаа
              </p>

              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleUndo}
                className="bg-[#0F172A] text-white font-medium text-xs leading-6 font-manrope px-2 rounded-[10px] h-6 cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 whitespace-nowrap"
              >
                Буцаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
