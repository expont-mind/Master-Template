"use client";

interface FilterPriceRangeProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export function FilterPriceRange({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: FilterPriceRangeProps) {
  return (
    <div>
      <p className="text-text-primary font-medium text-sm font-manrope mb-2">Үнийн хязгаар</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Бага"
          value={minPrice}
          onChange={(e) => onMinChange(e.target.value)}
          className="w-full px-3 py-2.5 sm:py-2 border border-border rounded-sm text-sm font-manrope focus:outline-none focus:border-text-primary transition-all duration-200 text-text-primary placeholder:text-text-secondary"
        />
        <span className="text-text-secondary">—</span>
        <input
          type="number"
          placeholder="Их"
          value={maxPrice}
          onChange={(e) => onMaxChange(e.target.value)}
          className="w-full px-3 py-2.5 sm:py-2 border border-border rounded-sm text-sm font-manrope focus:outline-none focus:border-text-primary transition-all duration-200 text-text-primary placeholder:text-text-secondary"
        />
      </div>
    </div>
  );
}

interface FilterInStockProps {
  inStock: boolean;
  onChange: (value: boolean) => void;
}

export function FilterInStock({ inStock, onChange }: FilterInStockProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0">
      <input
        type="checkbox"
        checked={inStock}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 sm:w-4 sm:h-4 rounded border-border accent-text-primary cursor-pointer"
      />
      <span className="text-text-primary text-sm font-manrope">Зөвхөн нөөцөд байгаа</span>
    </label>
  );
}

interface FilterActionsProps {
  onClear: () => void;
  onApply: () => void;
}

export function FilterActions({ onClear, onApply }: FilterActionsProps) {
  return (
    <div className="flex gap-2 pt-2 border-t border-border">
      <button
        onClick={onClear}
        className="flex-1 px-3 py-2.5 sm:py-2 text-sm font-manrope text-text-secondary hover:text-text-primary transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
      >
        Цэвэрлэх
      </button>
      <button
        onClick={onApply}
        className="flex-1 px-3 py-2.5 sm:py-2 bg-text-primary text-white text-sm font-manrope rounded-sm hover:bg-surface-dark transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
      >
        Хэрэглэх
      </button>
    </div>
  );
}
