"use client";

import { useQuery } from "@tanstack/react-query";
import { ArticleCard } from "./ArticleCard";
import { SectionTitle } from "@/components/home/SectionTitle";
import { articleKeys, getArticles } from "@/lib/queries/articles";
import { ChevronRight } from "../svg";

function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 min-w-[280px] sm:min-w-[320px] md:min-w-0 md:flex-1">
      <div className="w-full aspect-[3/2] skeleton rounded-lg" />
      <div className="flex flex-col gap-1.5">
        <div className="h-6 skeleton" />
        <div className="h-4 w-24 skeleton" />
      </div>
    </div>
  );
}

export function ArticlesClient() {
  const { data: articles, isLoading } = useQuery({
    queryKey: articleKeys.list(),
    queryFn: getArticles,
  });

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col items-center max-w-[1064px] w-full pb-[52px] px-4 xl:px-0 gap-7">
        <div className="pb-2 pt-8 md:pt-[52px] flex items-center gap-0.5 w-full">
          <p className="px-0.5 text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
            Нийтлэл
          </p>
          <ChevronRight />
        </div>

        <div className="flex flex-col gap-4 w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-[#64748B] font-normal text-base font-manrope">
                Нийтлэл олдсонгүй
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ArticlesSectionProps {
  iconSrc?: string;
}

export function ArticlesSection({ iconSrc }: ArticlesSectionProps) {
  const { data: articles, isLoading } = useQuery({
    queryKey: articleKeys.list(),
    queryFn: getArticles,
  });

  if (isLoading) {
    return (
      <div className="w-full bg-white flex justify-center">
        <div className="pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
          <div className="px-4 md:px-0">
            <SectionTitle title="Нийтлэл" iconSrc={iconSrc} href="/articles" />
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 md:pl-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
        <div className="px-4 md:px-0">
          <SectionTitle title="Нийтлэл" iconSrc={iconSrc} href="/articles" />
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 md:pl-0">
          {articles.slice(0, 3).map((article, index) => (
            <div
              key={article.id}
              className={
                index === articles.slice(0, 3).length - 1 ? "pr-4 md:pr-0" : ""
              }
            >
              <ArticleCard article={article} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
