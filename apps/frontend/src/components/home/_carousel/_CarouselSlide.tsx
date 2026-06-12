"use client";

import Image from "next/image";
import Link from "next/link";

import { isAnimatedImageUrl } from "@/lib/utils/formatters";

import { CarouselIndicator } from "./_CarouselIndicator";
import { type ResolvedSlide } from "./_types";

interface CarouselSlideProps {
  slide: ResolvedSlide;
  index: number;
  currentSlide: number;
  slidesCount: number;
  slideWidth: number;
  isMobile: boolean;
  progress: number;
  isPaused: boolean;
  isDragging: boolean;
  dragLastOffsetRef: React.RefObject<{ lastOffset: number }>;
  onTogglePause: () => void;
  onSelectSlide: (idx: number) => void;
  onNext: () => void;
}

function SlideContent({
  slide,
  index,
  currentSlide,
  slidesCount,
  progress,
  isPaused,
  onTogglePause,
  onSelectSlide,
  onNext,
}: Pick<
  CarouselSlideProps,
  | "slide"
  | "index"
  | "currentSlide"
  | "slidesCount"
  | "progress"
  | "isPaused"
  | "onTogglePause"
  | "onSelectSlide"
  | "onNext"
>) {
  return (
    <>
      <div className="absolute w-full h-full flex items-center justify-center overflow-hidden">
        {slide.image && (
          <Image
            src={slide.image}
            alt="Banner"
            fill
            sizes="100vw"
            quality={90}
            className="object-contain object-center overflow-hidden"
            priority={index === 0}
            unoptimized={isAnimatedImageUrl(slide.image)}
          />
        )}
      </div>
      <div className="relative w-full max-w-[1064px] h-full flex items-center justify-center">
        {index === currentSlide && (
          <CarouselIndicator
            currentSlide={currentSlide}
            slidesCount={slidesCount}
            progress={progress}
            isPaused={isPaused}
            onTogglePause={onTogglePause}
            onSelectSlide={onSelectSlide}
            onNext={onNext}
          />
        )}
      </div>
    </>
  );
}

const SLIDE_CLASS =
  "shrink-0 relative flex justify-center items-center rounded-[26px] overflow-hidden md:rounded-none md:h-[410px] select-none";

export function CarouselSlide(props: CarouselSlideProps) {
  const { slide, slideWidth, isMobile, dragLastOffsetRef } = props;
  const slideStyle = {
    width: slideWidth > 0 ? `${slideWidth}px` : undefined,
    height: isMobile && slideWidth > 0 ? `${Math.round((slideWidth * 10) / 9)}px` : undefined,
    backgroundColor: slide.bgColor,
  };

  if (slide.hasLink && slide.link) {
    return (
      <Link
        href={slide.link}
        className={SLIDE_CLASS}
        style={slideStyle}
        onClick={(e) => {
          if (Math.abs(dragLastOffsetRef.current.lastOffset) > 5) e.preventDefault();
        }}
        draggable={false}
      >
        <SlideContent {...props} />
      </Link>
    );
  }
  return (
    <div className={SLIDE_CLASS} style={slideStyle}>
      <SlideContent {...props} />
    </div>
  );
}
