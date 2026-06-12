"use client";

import { Cancel, Search } from "@/components/svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { RecentAndPopular } from "./_modal/_RecentAndPopular";
import { SuggestionsList } from "./_modal/_SuggestionGroups";
import { useSearchModal } from "./_modal/_useSearchModal";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchInputBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClear: () => void;
  onClose: () => void;
}

function SearchInputBar({
  inputRef,
  searchQuery,
  onChange,
  onKeyDown,
  onClear,
  onClose,
}: SearchInputBarProps) {
  return (
    <div className="flex items-center justify-center pt-4 pb-3 px-4">
      <div className="flex items-center gap-6 w-full max-w-[1064px]">
        <div className="flex-1 flex items-center gap-0.5 p-1 border border-border rounded-lg bg-white">
          <div className="p-1.5">
            <Search color="#94A3B8" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Бараа, брэнд, категори хайх"
            className="flex-1 outline-none text-sm text-text-primary font-manrope placeholder:text-text-secondary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 cursor-pointer hover:bg-border-light rounded transition-colors"
            >
              <Cancel />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-border-light rounded transition-colors"
        >
          <Cancel />
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-8 h-8 border-2 border-border border-t-text-primary rounded-full animate-spin" />
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="py-6">
      <p className="text-base text-text-primary font-manrope">
        &quot;{query}&quot; хайлтад илэрц олдсонгүй
      </p>
    </div>
  );
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const state = useSearchModal(isOpen, onClose);
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const hasSuggestions =
    state.showSuggestions && !state.isLoading && state.suggestions && state.suggestions.length > 0;

  return (
    <div className="fixed inset-0 z-999 overflow-hidden" style={{ overscrollBehavior: "none" }}>
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        className="absolute inset-0 bg-overlay cursor-default"
        style={{ touchAction: "none" }}
        onClick={onClose}
      />
      <div className="relative bg-white">
        <SearchInputBar
          inputRef={state.inputRef}
          searchQuery={state.searchQuery}
          onChange={state.setSearchQuery}
          onKeyDown={state.handleKeyDown}
          onClear={state.clearSearch}
          onClose={onClose}
        />
        <div className="flex flex-col items-center pt-2 pb-6 px-4 bg-white">
          <div className="w-full max-w-[1064px]">
            {state.showSuggestions && state.isLoading && <LoadingSpinner />}
            {state.noResults && <NoResults query={state.searchQuery} />}
            {hasSuggestions && (
              <SuggestionsList
                brandSuggestions={state.brandSuggestions}
                categorySuggestions={state.categorySuggestions}
                productSuggestions={state.productSuggestions}
                items={state.items}
                highlightIndex={state.highlightIndex}
                onSelect={state.handleSelect}
              />
            )}
            {!state.showSuggestions && (
              <RecentAndPopular
                showRecent={state.showRecent}
                showPopular={state.showPopular}
                recentSearches={state.recentSearches}
                trendingSearches={state.trendingSearches}
                highlightIndex={state.highlightIndex}
                onSelect={state.handleSelect}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
