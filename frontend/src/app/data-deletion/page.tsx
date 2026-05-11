"use client";

import { useState } from "react";
import Link from "next/link";

export default function DataDeletionPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email && !phone) {
      setError("Имэйл эсвэл утасны дугаар оруулна уу");
      return;
    }

    setLoading(true);

    // Simulate API call - in production, send to your backend
    try {
      // You can implement actual deletion request logic here
      // For example, send email notification or create a database entry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full bg-white flex justify-center min-h-[60vh]">
        <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[#020617] font-bold text-2xl md:text-[28px] font-manrope">
                Хүсэлт илгээгдлээ
              </h1>
              <p className="text-[#64748B] font-normal text-base font-manrope max-w-md">
                Таны өгөгдөл устгах хүсэлтийг хүлээн авлаа. Бид 30 хоногийн
                дотор таны хүсэлтийг шийдвэрлэж, имэйлээр мэдэгдэх болно.
              </p>
            </div>
            <Link
              href="/"
              className="mt-4 px-6 py-2.5 bg-[#020617] text-white font-medium text-base font-manrope rounded-sm hover:bg-[#1E293B] transition-colors duration-200"
            >
              Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
        <div className="flex flex-col gap-8 md:gap-12">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[#020617] font-bold text-2xl md:text-[28px] lg:text-[32px] leading-8 md:leading-10 font-manrope">
              Өгөгдөл устгах хүсэлт
            </h1>
            <p className="text-[#64748B] font-normal text-sm md:text-base font-manrope max-w-2xl">
              Хэрэв та Monpang дээрх бүртгэл болон бүх хувийн мэдээллээ
              устгуулахыг хүсвэл доорх маягтыг бөглөнө үү. Бид таны хүсэлтийг
              30 хоногийн дотор шийдвэрлэнэ.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-lg">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-[#020617] font-medium text-sm font-manrope"
              >
                Имэйл хаяг
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="example@email.com"
                className="h-12 px-4 border border-[#E2E8F0] rounded-sm text-[#020617] text-base font-manrope placeholder:text-[#94A3B8] outline-none focus:border-[#020617] transition-colors"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="phone"
                className="text-[#020617] font-medium text-sm font-manrope"
              >
                Утасны дугаар
              </label>
              <div className="h-12 flex items-center border border-[#E2E8F0] rounded-sm overflow-hidden focus-within:border-[#020617] transition-colors">
                <span className="px-3 text-[#64748B] h-full flex items-center text-base font-medium font-manrope select-none border-r border-[#E2E8F0]">
                  +976
                </span>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setPhone(val);
                    setError("");
                  }}
                  placeholder="00000000"
                  className="flex-1 px-3 h-full text-[#020617] text-base font-manrope placeholder:text-[#94A3B8] outline-none"
                />
              </div>
            </div>

            {/* Reason (optional) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reason"
                className="text-[#020617] font-medium text-sm font-manrope"
              >
                Шалтгаан{" "}
                <span className="text-[#94A3B8] font-normal">(заавал биш)</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Өгөгдлөө устгуулах шалтгаанаа бичнэ үү..."
                rows={4}
                className="px-4 py-3 border border-[#E2E8F0] rounded-sm text-[#020617] text-base font-manrope placeholder:text-[#94A3B8] outline-none focus:border-[#020617] transition-colors resize-none"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[#F43F5E] font-normal text-sm font-manrope">
                {error}
              </p>
            )}

            {/* Warning */}
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4 flex gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="shrink-0 mt-0.5"
              >
                <path
                  d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                  stroke="#D97706"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex flex-col gap-1">
                <p className="text-[#92400E] font-medium text-sm font-manrope">
                  Анхааруулга
                </p>
                <p className="text-[#A16207] font-normal text-sm font-manrope">
                  Өгөгдөл устгах хүсэлт баталгаажсаны дараа таны бүртгэл,
                  захиалгын түүх, хадгалсан бүтээгдэхүүн бүгд устах бөгөөд
                  сэргээх боломжгүй болохыг анхаарна уу.
                </p>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#DC2626] text-white font-medium text-base font-manrope rounded-sm hover:bg-[#B91C1C] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Илгээж байна..." : "Өгөгдөл устгах хүсэлт илгээх"}
            </button>
          </form>

          {/* Info section */}
          <div className="flex flex-col gap-4 pt-6 border-t border-[#E2E8F0] max-w-2xl">
            <h2 className="text-[#020617] font-semibold text-lg font-manrope">
              Юу устгагдах вэ?
            </h2>
            <ul className="list-disc list-inside space-y-2 text-[#64748B] font-normal text-sm md:text-base font-manrope pl-2">
              <li>Таны бүртгэлийн мэдээлэл (нэр, имэйл, утас)</li>
              <li>Захиалгын түүх</li>
              <li>Хадгалсан бүтээгдэхүүн (wishlist)</li>
              <li>Хүргэлтийн хаягууд</li>
              <li>Facebook, Google холболт</li>
            </ul>
          </div>

          {/* Footer links */}
          <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="text-[#020617] font-medium text-sm md:text-base font-manrope underline hover:text-[#64748B] transition-colors duration-200"
            >
              ← Нүүр хуудас руу буцах
            </Link>
            <Link
              href="/privacy-policy"
              className="text-[#64748B] font-medium text-sm md:text-base font-manrope underline hover:text-[#020617] transition-colors duration-200"
            >
              Нууцлалын бодлого
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
