"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { Slash } from "@/components/svg";
import { articleKeys, getArticles } from "@/lib/queries/articles";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { Article } from "@/types/database";

interface ArticleDetailClientProps {
  article: Article;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
  } catch {
    return "";
  }
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.33333 10.8333C8.69321 11.3118 9.14779 11.7077 9.66894 11.9972C10.1901 12.2867 10.7662 12.4635 11.3601 12.5157C11.954 12.5679 12.5523 12.4943 13.1168 12.2997C13.6812 12.1052 14.199 11.7941 14.6375 11.3867L17.1375 8.88667C17.9296 8.06475 18.3682 6.97059 18.3587 5.83573C18.3493 4.70086 17.8926 3.61392 17.0869 2.80567C16.2812 1.99743 15.1958 1.53744 14.0609 1.52415C12.926 1.51085 11.8302 1.94579 11.0058 2.73417L9.68333 4.05"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6666 9.16665C11.3067 8.6882 10.8521 8.29232 10.331 8.00279C9.80981 7.71326 9.23372 7.53647 8.63983 7.48428C8.04594 7.43209 7.44762 7.50566 6.88317 7.70021C6.31872 7.89477 5.80093 8.20587 5.36244 8.61331L2.86244 11.1133C2.07035 11.9352 1.63178 13.0294 1.64122 14.1643C1.65066 15.2991 2.10739 16.3861 2.91308 17.1943C3.71878 18.0026 4.80417 18.4626 5.93906 18.4758C7.07394 18.4891 8.16974 18.0542 8.9941 17.2658L10.3083 15.95"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.66699 10.0013C1.66699 6.85893 1.66699 5.28775 2.64331 4.31143C3.61963 3.33511 5.19081 3.33511 8.33366 3.33511H11.667C14.8098 3.33511 16.381 3.33511 17.3573 4.31143C18.3337 5.28775 18.3337 6.85893 18.3337 10.0013C18.3337 13.1437 18.3337 14.7148 17.3573 15.6912C16.381 16.6675 14.8098 16.6675 11.667 16.6675H8.33366C5.19081 16.6675 3.61963 16.6675 2.64331 15.6912C1.66699 14.7148 1.66699 13.1437 1.66699 10.0013Z"
        stroke="#64748B"
        strokeWidth="1.25"
      />
      <path
        d="M5 6.66797L6.74372 8.07521C8.43855 9.44462 9.28596 10.1293 10.0004 10.1284C10.7148 10.1275 11.5611 9.44121 13.2537 8.06862L15 6.66797"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.8333 10.8333V15.8333C15.8333 16.2754 15.6577 16.6993 15.3452 17.0118C15.0326 17.3244 14.6087 17.5 14.1667 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V5.83333C2.5 5.39131 2.67559 4.96738 2.98816 4.65482C3.30072 4.34226 3.72464 4.16667 4.16667 4.16667H9.16667"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 2.5H17.5V7.5"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33301 11.6667L17.4997 2.5"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="10" width="36" height="28" rx="2" stroke="#CBD5E1" strokeWidth="1.5" />
        <circle cx="16" cy="20" r="3" stroke="#CBD5E1" strokeWidth="1.5" />
        <path
          d="M6 32L16 24L26 32L36 22L42 28"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-text-muted text-sm font-manrope">3:2</span>
    </div>
  );
}

function SidebarArticleCard({ article }: { article: Article }) {
  const displayDate = article.published_at || article.created_at;

  return (
    <Link href={`/articles/${article.slug}`} className="flex flex-col gap-2">
      <div className="relative w-full aspect-[3/2] bg-border-light rounded-sm overflow-hidden">
        {article.is_featured && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 bg-text-primary rounded text-white font-medium text-xs font-manrope">
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
            sizes="280px"
            quality={90}
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-text-primary font-medium text-sm font-manrope leading-5 line-clamp-2">
          {article.title}
        </h3>
        {displayDate && (
          <span className="text-text-secondary font-normal text-xs font-manrope">
            {formatDate(displayDate)}
          </span>
        )}
      </div>
    </Link>
  );
}

export function ArticleDetailClient({ article }: ArticleDetailClientProps) {
  const { data: articles } = useQuery({
    queryKey: articleKeys.list(),
    queryFn: getArticles,
  });

  // Get related articles (exclude current article)
  const relatedArticles = articles?.filter((a) => a.id !== article.id).slice(0, 3) || [];

  const displayDate = article.published_at || article.created_at;

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 pb-20 md:pb-[52px]">
        {/* Breadcrumb */}
        <div className="flex flex-col py-2.5 md:pt-8 md:pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <Link
              href="/articles"
              className="text-text-secondary font-normal text-sm font-manrope hover:text-text-primary transition-colors duration-200"
            >
              Нийтлэл
            </Link>
            <Slash />
            {article.is_featured ? (
              <span className="text-text-primary font-normal text-sm font-manrope">Онцлох</span>
            ) : (
              <span className="text-text-primary font-normal text-sm font-manrope">
                {article.type || "Нийтлэл"}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="px-0.5 text-text-primary font-bold text-[26px] leading-9 font-manrope tracking-[-0.26px] hidden md:block">
            {article.title}
          </h1>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-4">
          {/* Left Column - Main Content */}
          <div className="flex-1 flex gap-4">
            {/* Social Icons Sidebar */}
            <div className="hidden md:flex flex-col gap-4 pt-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors duration-200">
                <LinkIcon />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors duration-200">
                <MailIcon />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors duration-200">
                <ExternalLinkIcon />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Main Image */}
              <div className="relative w-full aspect-[3/2] bg-border-light rounded-sm overflow-hidden">
                {article.image_url ? (
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 700px"
                    quality={90}
                    priority
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              {/* Published Date */}
              {displayDate && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary font-medium text-base font-manrope">
                    Нийтэлсэн огноо
                  </span>
                  <span className="text-text-primary font-semibold text-base font-manrope">
                    {formatDate(displayDate)}
                  </span>
                </div>
              )}

              {/* Article Content */}
              {article.content && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary font-medium text-base font-manrope">
                    Дэлгэрэнгүй
                  </span>
                  <div className="text-text-primary font-medium text-base font-manrope whitespace-pre-line">
                    {article.content}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="w-full lg:w-[280px] flex flex-col gap-6">
              {relatedArticles.map((relatedArticle) => (
                <SidebarArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
