"use client";

interface ChipFilterProps {
  chips: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export const ChipFilter = ({
  chips,
  activeIndex,
  onChange,
}: ChipFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {chips.map((chip, index) => (
        <button
          key={chip}
          onClick={() => onChange(index)}
          className={`h-10 sm:h-12 rounded-full px-3 border sm:px-5 text-sm sm:text-base font-manrope whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            index === activeIndex
              ? "bg-[#020617] border-transparent text-white font-medium"
              : "bg-white border-[#E2E8F0] font-normal text-[#64748B] hover:border-[#CBD5E1]"
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
};
