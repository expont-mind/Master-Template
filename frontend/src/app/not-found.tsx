import Link from "next/link";
import type { Metadata } from "next";
import { ROUTES } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "Хуудас олдсонгүй",
  description: "Хайсан хуудас олдсонгүй. Дэлгүүр хэсэх рүү буцна уу.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center max-w-[1064px] w-full px-4 py-16 md:py-24 text-center">
        <p className="text-[#020617] font-bold text-6xl md:text-7xl font-manrope leading-none">
          404
        </p>
        <p className="mt-4 text-[#020617] font-semibold text-xl md:text-2xl font-manrope">
          Хуудас олдсонгүй
        </p>
        <p className="mt-2 max-w-[420px] text-[#64748B] font-normal text-base font-manrope leading-6">
          Энэ хуудас хасагдсан, шилжсэн эсвэл огт байгаагүй байж магадгүй.
          Дэлгүүр хэсэх руу буцаж бараагаа үргэлжлүүлэн харж болно.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href={ROUTES.HOME}
            className="inline-flex h-11 items-center justify-center rounded-sm border border-[#E2E8F0] px-5 text-[#020617] font-medium text-sm font-manrope hover:bg-[#F8FAFC] transition-colors duration-200"
          >
            Нүүр хуудас
          </Link>
          <Link
            href={ROUTES.PRODUCTS}
            className="inline-flex h-11 items-center justify-center rounded-sm bg-[#020617] px-5 text-white font-medium text-sm font-manrope hover:bg-[#1E293B] transition-colors duration-200"
          >
            Дэлгүүр хэсэх
          </Link>
        </div>
      </div>
    </div>
  );
}
