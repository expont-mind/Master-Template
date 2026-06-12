"use client";

// Desktop: 4 rows of 7
export const ALPHABET_DESKTOP = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z", "#", " "],
];

// Mobile: 3 rows (11, 11, 5)
export const ALPHABET_MOBILE = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
  ["L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V"],
  ["W", "X", "Y", "Z", "#", " ", " ", " ", " ", " ", " "],
];

interface BrandsAlphaSectionProps {
  rows: string[][];
  activeLetter: string | null;
  onLetterClick: (letter: string) => void;
  variant: "mobile" | "desktop";
}

export function BrandsAlphaSection({
  rows,
  activeLetter,
  onLetterClick,
  variant,
}: BrandsAlphaSectionProps) {
  const isMobile = variant === "mobile";
  const buttonClass = isMobile
    ? "w-5 h-6 flex items-center justify-center text-base font-medium font-manrope rounded-lg cursor-pointer transition-colors"
    : "w-8 h-8 flex items-center justify-center text-base font-medium font-manrope rounded-sm cursor-pointer transition-colors";
  const emptyClass = isMobile ? "w-5 h-6" : "w-8 h-8";

  const containerClass = isMobile
    ? "flex flex-col gap-x-3 gap-y-1 pt-2 md:hidden"
    : "hidden md:flex flex-col gap-1 py-3";

  const rowClass = isMobile ? "flex justify-between" : "flex gap-1";

  const activeStyle = isMobile ? "bg-text-primary text-white" : "bg-text-primary text-white";

  const inactiveStyle = isMobile
    ? "text-text-secondary hover:bg-border-light"
    : "text-text-primary hover:bg-border-light";

  return (
    <div className={containerClass}>
      {rows.map((row) => (
        <div key={row.join("")} className={rowClass}>
          {row.map((letter, letterIndex) =>
            letter.trim() ? (
              <button
                key={letter}
                onClick={() => onLetterClick(letter)}
                className={`${buttonClass} ${
                  activeLetter === letter ? activeStyle : inactiveStyle
                }`}
              >
                {letter}
              </button>
            ) : (
              // Empty slot is a static placeholder in a fixed alphabet row; position is stable.
              // eslint-disable-next-line react/no-array-index-key
              <span key={`empty-${letterIndex}`} className={emptyClass} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
