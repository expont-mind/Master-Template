"use client";

import {
  AutocompleteEmptyState,
  AutocompleteLoading,
  CategorySuggestionsList,
  ProductSuggestionsList,
  RecentSearchesList,
} from "./_AutocompleteResultsDropdown";
import { useAutocompleteState, type AutocompleteSelection } from "./_useAutocompleteState";

interface SearchAutocompleteProps {
  query: string;
  isOpen: boolean;
  onSelect: (suggestion: AutocompleteSelection) => void;
  onClose: () => void;
}

type AutocompleteStateOutput = ReturnType<typeof useAutocompleteState>;

type RenderMode = "hidden" | "empty" | "dropdown";

function resolveRenderMode(
  isOpen: boolean,
  query: string,
  state: AutocompleteStateOutput,
): RenderMode {
  if (!isOpen) return "hidden";
  const { showRecent, showSuggestions, isLoading, productSuggestions, categorySuggestions } = state;
  if (!showRecent && !showSuggestions) return "hidden";
  const noResults =
    showSuggestions &&
    !isLoading &&
    productSuggestions.length === 0 &&
    categorySuggestions.length === 0;
  if (noResults) {
    return query.length >= 2 ? "empty" : "hidden";
  }
  return "dropdown";
}

interface AutocompleteDropdownProps {
  state: AutocompleteStateOutput;
  onSelect: (s: AutocompleteSelection) => void;
}

function AutocompleteDropdown({ state, onSelect }: AutocompleteDropdownProps) {
  const {
    isLoading,
    recentSearches,
    removeSearch,
    clearAll,
    productSuggestions,
    categorySuggestions,
    highlightIndex,
    showRecent,
    showSuggestions,
  } = state;

  const recentCount = showRecent ? recentSearches.length : 0;
  const categoryBase = recentCount;
  const productBase = recentCount + categorySuggestions.length;
  const showCategoryList = showSuggestions && !isLoading && categorySuggestions.length > 0;
  const showProductList = showSuggestions && !isLoading && productSuggestions.length > 0;
  const showLoadingSpinner = showSuggestions && isLoading;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
      {showRecent && (
        <RecentSearchesList
          recentSearches={recentSearches}
          highlightIndex={highlightIndex}
          baseIndex={0}
          onSelect={(text) => onSelect({ type: "recent", text, slug: "" })}
          onRemove={removeSearch}
          onClearAll={clearAll}
        />
      )}

      {showLoadingSpinner && <AutocompleteLoading />}

      {showCategoryList && (
        <CategorySuggestionsList
          suggestions={categorySuggestions}
          highlightIndex={highlightIndex}
          baseIndex={categoryBase}
          onSelect={onSelect}
        />
      )}

      {showProductList && (
        <ProductSuggestionsList
          suggestions={productSuggestions}
          highlightIndex={highlightIndex}
          baseIndex={productBase}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

export function SearchAutocomplete({ query, isOpen, onSelect, onClose }: SearchAutocompleteProps) {
  const state = useAutocompleteState({ query, isOpen, onSelect, onClose });
  const mode = resolveRenderMode(isOpen, query, state);

  if (mode === "hidden") return null;
  if (mode === "empty") return <AutocompleteEmptyState />;
  return <AutocompleteDropdown state={state} onSelect={onSelect} />;
}
