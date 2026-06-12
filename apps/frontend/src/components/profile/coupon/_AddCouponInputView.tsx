"use client";

import { Cancel } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";

interface AddCouponInputViewProps {
  code: string;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
}

export function AddCouponInputView({
  code,
  error,
  loading,
  onClose,
  onCodeChange,
  onSubmit,
}: AddCouponInputViewProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <PrimaryHeading>Купон нэмэх</PrimaryHeading>
        <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Close">
          <Cancel />
        </button>
      </div>

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
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="Купон кодоо оруулна уу"
          className={`w-full h-12 pl-3 pr-0.5 bg-white border ${error ? "border-brand-primary" : "border-border"} placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200`}
        />
        {error && <p className="text-brand-primary text-xs font-manrope mt-0.5">{error}</p>}
      </div>

      <button
        onClick={onSubmit}
        disabled={loading || !code.trim()}
        className={`w-full py-2.5 px-3 rounded-sm font-normal text-base font-manrope transition-colors duration-200 ${
          loading || !code.trim()
            ? "bg-text-primary/30 text-white cursor-not-allowed"
            : "bg-text-primary text-white cursor-pointer hover:bg-surface-dark"
        }`}
      >
        {loading ? "Шалгаж байна..." : "Нэмэх"}
      </button>
    </>
  );
}
