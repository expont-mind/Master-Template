"use client";

import { SITE } from "@repo/config-site";
import { useRouter } from "next/navigation";

import { type WishlistAuthState } from "@/app/wishlist/_hooks/useWishlistAuth";
import { Cancel, Facebook, Google, Heart } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";
import { LOCALE } from "@/lib/utils/brand-config";

// The login channel comes from config; the auth hook branches the same way.
const IS_EMAIL = SITE.auth.method === "email";

const OTP_SLOT_IDS = ["otp-1", "otp-2", "otp-3", "otp-4", "otp-5", "otp-6"] as const;

function PhoneStep({ auth }: { auth: WishlistAuthState }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor="login-identifier-input"
            className="text-text-primary font-normal text-sm font-manrope"
          >
            {IS_EMAIL ? "Имэйл" : "Утас"}
          </label>
          <div className="h-12 flex items-center border border-border rounded-sm overflow-hidden focus-within:border-text-primary transition-colors group">
            {!IS_EMAIL && (
              <span className="px-3 text-text-secondary h-full flex items-center text-base font-medium font-manrope select-none border-r border-border group-focus-within:border-r-text-primary transition-colors">
                +{LOCALE.phoneCountryCode}
              </span>
            )}
            <input
              id="login-identifier-input"
              type={IS_EMAIL ? "email" : "tel"}
              inputMode={IS_EMAIL ? "email" : "numeric"}
              placeholder={IS_EMAIL ? "name@example.com" : "Энд оруулна уу"}
              value={auth.phone}
              onChange={(e) => {
                const val = IS_EMAIL
                  ? e.target.value
                  : e.target.value.replace(/\D/g, "").slice(0, 8);
                auth.setPhone(val);
                auth.setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") auth.handleSendOtp();
              }}
              className="flex-1 px-3 py-3 outline-none text-text-primary text-sm font-normal font-manrope placeholder:text-text-secondary"
            />
          </div>
          {auth.error && (
            <p className="text-brand-primary font-normal text-sm font-manrope">{auth.error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={auth.handleSendOtp}
          disabled={auth.loading}
          className={`w-full py-2.5 px-3 rounded-sm text-white font-normal text-base font-manrope transition-colors duration-200 ${
            (IS_EMAIL ? auth.phone.includes("@") : auth.phone.length >= 8)
              ? "bg-text-primary cursor-pointer hover:bg-surface-dark"
              : "bg-text-primary/30 cursor-not-allowed"
          }`}
        >
          {auth.loading ? "Илгээж байна..." : "Үргэлжлүүлэх"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-secondary font-medium text-xs font-manrope">Эсвэл</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => auth.handleSocialLogin("facebook")}
          className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors duration-200"
        >
          <Facebook />
          <span className="text-text-subtle font-normal text-base font-manrope flex-1">
            Facebook-р нэвтрэх
          </span>
        </button>
        <button
          type="button"
          onClick={() => auth.handleSocialLogin("google")}
          className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors duration-200"
        >
          <Google />
          <span className="text-text-subtle font-normal text-base font-manrope flex-1">
            Google-р нэвтрэх
          </span>
        </button>
      </div>
    </div>
  );
}

function OtpCountdown({ countdown, loading }: { countdown: number; loading: boolean }) {
  if (loading) {
    return (
      <p className="text-text-secondary font-normal text-sm font-manrope text-center">
        Шалгаж байна...
      </p>
    );
  }
  if (countdown > 0) {
    return (
      <p className="text-text-secondary font-normal text-sm font-manrope text-center">
        Код хүчинтэй: {countdown}с
      </p>
    );
  }
  return (
    <p className="text-brand-primary font-normal text-sm font-manrope text-center">
      Кодын хугацаа дууслаа. Дахин илгээнэ үү.
    </p>
  );
}

function OtpStep({ auth }: { auth: WishlistAuthState }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-primary font-normal text-base font-manrope leading-6">
        {auth.phone} {IS_EMAIL ? "хаяг руу" : "дугаар руу"} 6 оронтой код илгээлээ.
      </p>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={OTP_SLOT_IDS[0]}
          className="text-text-primary font-medium text-sm font-manrope"
        >
          Баталгаажуулах код
        </label>
        <div className="flex items-center justify-center gap-3" onPaste={auth.handleOtpPaste}>
          {OTP_SLOT_IDS.map((slotId, i) => (
            <input
              key={slotId}
              id={slotId}
              ref={(el) => {
                auth.otpRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              {...(i !== 0 && { maxLength: 1 })}
              value={auth.otp[i]}
              onChange={(e) => auth.handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => auth.handleOtpKeyDown(i, e)}
              className="w-11 h-11 text-center text-lg font-semibold font-manrope text-text-primary border border-border rounded-[10px] outline-none focus:border-text-primary transition-colors"
            />
          ))}
        </div>
        {auth.error && (
          <p className="text-brand-primary font-normal text-sm font-manrope text-center">
            {auth.error}
          </p>
        )}
      </div>

      <OtpCountdown countdown={auth.countdown} loading={auth.loading} />

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={auth.resetToPhoneStep}
          className="text-text-secondary font-normal text-sm font-manrope underline cursor-pointer hover:text-text-primary transition-colors duration-200"
        >
          {IS_EMAIL ? "Хаяг солих" : "Дугаар солих"}
        </button>
        <button
          type="button"
          onClick={auth.handleSendOtp}
          disabled={auth.loading || auth.countdown > 0}
          className="text-text-primary font-medium text-sm font-manrope underline cursor-pointer hover:text-text-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {auth.countdown > 0 ? `Дахин илгээх (${auth.countdown}с)` : "Дахин илгээх"}
        </button>
      </div>
    </div>
  );
}

export function LoginPrompt({ auth }: { auth: WishlistAuthState }) {
  const router = useRouter();
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope">
          Хадгалсан
        </p>
        <div className="flex flex-col gap-7 pt-4 pb-10">
          <div className="py-2">
            <div className="w-full h-px bg-border" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-[88px]">
            <div className="max-w-[392px] w-full flex flex-col items-center justify-center gap-4">
              <div className="py-2">
                <Heart />
              </div>
              <p className="text-text-secondary font-normal text-base font-manrope text-center leading-6">
                Нэвтэрснээр бүтээгдэхүүн
                <br />
                хадгалах боломжтой.
              </p>
            </div>
            <div className="w-full max-w-[375px] bg-white border border-border rounded-[10px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <PrimaryHeading>Нэвтрэх</PrimaryHeading>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="p-1 cursor-pointer"
                  aria-label="Хаах"
                >
                  <Cancel />
                </button>
              </div>
              {auth.step === "phone" ? <PhoneStep auth={auth} /> : <OtpStep auth={auth} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
