"use client";

import { SectionTitle, SuggestionGroupHeader, SuggestionRow } from "./_SuggestionRow";
import { type SearchItem } from "./_types";

import type { SearchSuggestion } from "@/lib/queries/search";

interface SuggestionGroupProps {
  label: string;
  type: SearchItem["type"];
  suggestions: SearchSuggestion[];
  items: SearchItem[];
  highlightIndex: number;
  onSelect: (item: SearchItem) => void;
}

function SuggestionGroup({
  label,
  type,
  suggestions,
  items,
  highlightIndex,
  onSelect,
}: SuggestionGroupProps) {
  if (suggestions.length === 0) return null;
  return (
    <>
      <SuggestionGroupHeader label={label} />
      {suggestions.map((suggestion) => {
        const itemIndex = items.findIndex((i) => i.type === type && i.slug === suggestion.slug);
        return (
          <SuggestionRow
            key={`${type}-${suggestion.slug}`}
            text={suggestion.text}
            isHighlighted={highlightIndex === itemIndex}
            onClick={() =>
              onSelect({
                type,
                text: suggestion.text,
                slug: suggestion.slug,
                original: suggestion,
              })
            }
          />
        );
      })}
    </>
  );
}

interface SuggestionsListProps {
  brandSuggestions: SearchSuggestion[];
  categorySuggestions: SearchSuggestion[];
  productSuggestions: SearchSuggestion[];
  items: SearchItem[];
  highlightIndex: number;
  onSelect: (item: SearchItem) => void;
}

export function SuggestionsList({
  brandSuggestions,
  categorySuggestions,
  productSuggestions,
  items,
  highlightIndex,
  onSelect,
}: SuggestionsListProps) {
  return (
    <div className="flex flex-col">
      <SectionTitle label="Илэрц" />
      <SuggestionGroup
        label="Брэнд"
        type="brand"
        suggestions={brandSuggestions}
        items={items}
        highlightIndex={highlightIndex}
        onSelect={onSelect}
      />
      <SuggestionGroup
        label="Категори"
        type="category"
        suggestions={categorySuggestions}
        items={items}
        highlightIndex={highlightIndex}
        onSelect={onSelect}
      />
      <SuggestionGroup
        label="Бараа"
        type="product"
        suggestions={productSuggestions}
        items={items}
        highlightIndex={highlightIndex}
        onSelect={onSelect}
      />
    </div>
  );
}
