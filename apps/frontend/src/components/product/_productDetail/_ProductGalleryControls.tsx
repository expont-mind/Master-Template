"use client";

import Image from "next/image";

import { ChevronLeft28, ChevronRight28 } from "@/components/svg";

export function DesktopArrows({
  allImages,
  setCurrentImageIndex,
}: {
  allImages: string[];
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
        }}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
      >
        <ChevronLeft28 />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
        }}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/80 border-2 border-white/10 rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-surface"
      >
        <ChevronRight28 />
      </button>
    </>
  );
}

export function MobileThumbStrip({
  productName,
  allImages,
  currentImageIndex,
  setCurrentImageIndex,
  scrollToImage,
}: {
  productName: string;
  allImages: string[];
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  scrollToImage: (index: number) => void;
}) {
  return (
    <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide pl-[18px] pt-3 pb-1.5 md:px-4 md:py-3">
      {allImages.map((image, index) => (
        <div key={image} className="flex gap-2 items-center">
          <button
            onClick={() => {
              setCurrentImageIndex(index);
              scrollToImage(index);
            }}
            className={`w-[46px] md:w-[72px] h-[46px] md:h-[72px] p-0.5 md:p-0 shrink-0 rounded-[9px] md:rounded-sm overflow-hidden border md:border-2 cursor-pointer transition-all ${
              index === currentImageIndex ? "border-text-primary" : "border-transparent"
            }`}
          >
            <Image
              src={image}
              alt={`${productName} - ${index + 1}`}
              width={48}
              height={48}
              quality={90}
              className="w-full h-full object-cover rounded-[6px] md:rounded-sm"
            />
          </button>
          {index === 0 && <div className="w-px h-[38px] bg-border shrink-0" />}
        </div>
      ))}
    </div>
  );
}
