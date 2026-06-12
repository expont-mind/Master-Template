"use client";

import { ArrowUpRight } from "@/components/svg";

import { ClockIcon } from "./_ClockIcon";
import { SectionTitle, SuggestionRow } from "./_SuggestionRow";
import { type SearchItem } from "./_types";

interface RecentAndPopularProps {
  showRecent: boolean;
  showPopular: boolean;
  recentSearches: string[];
  trendingSearches: string[];
  highlightIndex: number;
  onSelect: (item: SearchItem) => void;
}

export function RecentAndPopular({
  showRecent,
  showPopular,
  recentSearches,
  trendingSearches,
  highlightIndex,
  onSelect,
}: RecentAndPopularProps) {
  const recentSlice = recentSearches.slice(0, 2);
  return (
    <div className="flex flex-col">
      {showRecent && (
        <>
          <SectionTitle label="Сүүлд хайсан" />
          {recentSlice.map((text, idx) => (
            <SuggestionRow
              key={text}
              text={text}
              isHighlighted={highlightIndex === idx}
              trailingIcon={<ClockIcon />}
              onClick={() => onSelect({ type: "recent", text, slug: "" })}
            />
          ))}
        </>
      )}
      {showPopular && (
        <>
          <SectionTitle label="Их хайдаг" />
          {trendingSearches.map((text, idx) => {
            const itemIndex = showRecent ? recentSlice.length + idx : idx;
            return (
              <SuggestionRow
                key={text}
                text={text}
                isHighlighted={highlightIndex === itemIndex}
                trailingIcon={<ArrowUpRight color="#94A3B8" className="shrink-0" />}
                onClick={() => onSelect({ type: "popular", text, slug: "" })}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
