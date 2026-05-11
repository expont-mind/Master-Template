"use client";

import Image from "next/image";
import Link from "next/link";
import { parseAsUTC } from "@/lib/utils/formatters";
import type { Article } from "@/types/database";

interface ArticleCardProps {
  article: Article;
}

function getRelativeTime(dateString: string): string {
  const date = parseAsUTC(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInYears > 0) {
    return `${diffInYears} жилийн өмнө`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} сарын өмнө`;
  } else if (diffInDays > 0) {
    return `${diffInDays} өдрийн өмнө`;
  } else {
    return "Өнөөдөр";
  }
}

export function ArticleCard({ article }: ArticleCardProps) {
  const displayDate = article.published_at || article.created_at;

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="flex flex-col gap-3 min-w-[280px] sm:min-w-[320px] md:min-w-0 md:flex-1"
    >
      <div className="relative w-full aspect-[3/2] bg-[#F8FAFC] rounded-lg overflow-hidden">
        {article.is_featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 bg-white rounded-full text-[#020617] font-medium text-xs font-manrope shadow-sm">
              Онцлох
            </span>
          </div>
        )}
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 280px, 320px"
            quality={75}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="6"
                y="10"
                width="36"
                height="28"
                rx="2"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <circle cx="16" cy="20" r="3" stroke="#CBD5E1" strokeWidth="1.5" />
              <path
                d="M6 32L16 24L26 32L36 22L42 28"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[#94A3B8] text-sm font-manrope">3:2</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[#020617] font-medium text-base sm:text-lg font-manrope leading-6 line-clamp-2">
          {article.title}
        </h3>
        {displayDate && (
          <span className="text-[#64748B] font-normal text-sm font-manrope">
            {getRelativeTime(displayDate)}
          </span>
        )}
      </div>
    </Link>
  );
}
