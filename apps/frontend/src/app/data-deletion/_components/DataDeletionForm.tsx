"use client";

import { LOCALE } from "@/lib/utils/brand-config";

interface DataDeletionFormProps {
  email: string;
  phone: string;
  reason: string;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReasonChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function DataDeletionForm({
  email,
  phone,
  reason,
  loading,
  error,
  onSubmit,
  onEmailChange,
  onPhoneChange,
  onReasonChange,
}: DataDeletionFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 max-w-lg">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-text-primary font-medium text-sm font-manrope">
          Имэйл хаяг
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={onEmailChange}
          placeholder="example@email.com"
          className="h-12 px-4 border border-border rounded-sm text-text-primary text-base font-manrope placeholder:text-text-muted outline-none focus:border-text-primary transition-colors"
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-text-primary font-medium text-sm font-manrope">
          Утасны дугаар
        </label>
        <div className="h-12 flex items-center border border-border rounded-sm overflow-hidden focus-within:border-text-primary transition-colors">
          <span className="px-3 text-text-secondary h-full flex items-center text-base font-medium font-manrope select-none border-r border-border">
            +{LOCALE.phoneCountryCode}
          </span>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={onPhoneChange}
            placeholder="00000000"
            className="flex-1 px-3 h-full text-text-primary text-base font-manrope placeholder:text-text-muted outline-none"
          />
        </div>
      </div>

      {/* Reason (optional) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-text-primary font-medium text-sm font-manrope">
          Шалтгаан <span className="text-text-muted font-normal">(заавал биш)</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={onReasonChange}
          placeholder="Өгөгдлөө устгуулах шалтгаанаа бичнэ үү..."
          rows={4}
          className="px-4 py-3 border border-border rounded-sm text-text-primary text-base font-manrope placeholder:text-text-muted outline-none focus:border-text-primary transition-colors resize-none"
        />
      </div>

      {/* Error message */}
      {error && <p className="text-brand-primary font-normal text-sm font-manrope">{error}</p>}

      {/* Warning */}
      <div className="bg-amber-100 border border-amber-500 rounded-lg p-4 flex gap-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
          <path
            d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex flex-col gap-1">
          <p className="text-amber-800 font-medium text-sm font-manrope">Анхааруулга</p>
          <p className="text-yellow-700 font-normal text-sm font-manrope">
            Өгөгдөл устгах хүсэлт баталгаажсаны дараа таны бүртгэл, захиалгын түүх, хадгалсан
            бүтээгдэхүүн бүгд устах бөгөөд сэргээх боломжгүй болохыг анхаарна уу.
          </p>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white font-medium text-base font-manrope rounded-sm hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Илгээж байна..." : "Өгөгдөл устгах хүсэлт илгээх"}
      </button>
    </form>
  );
}
