"use client";

import { ChevronRightWhite, Pause, Play } from "@/components/svg";

interface CarouselIndicatorProps {
  currentSlide: number;
  slidesCount: number;
  progress: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onSelectSlide: (idx: number) => void;
  onNext: () => void;
}

function PauseButton({ isPaused, onToggle }: { isPaused: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
      className="bg-white/80 backdrop-blur-[50px] border-2 border-white/10 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-pointer"
      aria-label={isPaused ? "Play" : "Pause"}
    >
      {isPaused ? (
        <Play className="w-4 h-4 md:w-5 md:h-5 text-text-primary" />
      ) : (
        <Pause className="w-4 h-4 md:w-5 md:h-5 text-text-primary" />
      )}
    </button>
  );
}

function Dots({
  slidesCount,
  currentSlide,
  progress,
  onSelectSlide,
}: Pick<CarouselIndicatorProps, "slidesCount" | "currentSlide" | "progress" | "onSelectSlide">) {
  return (
    <>
      {Array.from({ length: slidesCount }, (_, dotIndex) => (
        <button
          key={dotIndex}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSelectSlide(dotIndex);
          }}
          className="relative"
          aria-label={`Go to slide ${dotIndex + 1}`}
        >
          {dotIndex === currentSlide ? (
            <div className="bg-text-primary/40 rounded-full w-8 h-[6px] md:h-[7px] overflow-hidden">
              <div
                className="bg-text-primary h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : (
            <div className="bg-text-primary/40 rounded-full w-[6px] md:w-[7px] h-[6px] md:h-[7px] hover:bg-slate-500 transition-colors" />
          )}
        </button>
      ))}
    </>
  );
}

export function CarouselIndicator({
  currentSlide,
  slidesCount,
  progress,
  isPaused,
  onTogglePause,
  onSelectSlide,
  onNext,
}: CarouselIndicatorProps) {
  return (
    <div
      className="absolute bottom-2 md:bottom-5 right-2 md:right-[15px] flex gap-1.5 items-center z-20"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label="Carousel controls"
    >
      <PauseButton isPaused={isPaused} onToggle={onTogglePause} />
      <div className="bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] h-10 md:h-12 px-4 md:px-5 flex items-center gap-2 md:gap-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-auto">
        <Dots
          slidesCount={slidesCount}
          currentSlide={currentSlide}
          progress={progress}
          onSelectSlide={onSelectSlide}
        />
        <div className="items-center gap-0.5 hidden md:flex">
          <span className="text-text-primary text-sm font-bold">
            {currentSlide + 1}/{slidesCount}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onNext();
            }}
            className="text-text-primary cursor-pointer hover:text-text-primary/80 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRightWhite />
          </button>
        </div>
      </div>
    </div>
  );
}
