"use client";

import Image from "next/image";

import {
  DesktopArrows,
  MobileThumbStrip,
} from "@/components/product/_productDetail/_ProductGalleryControls";

interface ProductGalleryProps {
  productName: string;
  allImages: string[];
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  imageScrollRef: React.RefObject<HTMLDivElement | null>;
  handleImageScroll: () => void;
  scrollToImage: (index: number) => void;
  onOpenImageModal: () => void;
}

function ImageCounter({
  current,
  total,
  mobile = false,
}: {
  current: number;
  total: number;
  mobile?: boolean;
}) {
  const visibility = mobile ? "md:hidden" : "hidden md:block";
  return (
    <div
      className={`${visibility} absolute top-4 right-4 bg-text-primary/40 text-white text-sm font-medium font-manrope px-1.5 py-0.5 rounded-full`}
    >
      {current}/{total}
    </div>
  );
}

/**
 * Image gallery showing left-column thumbnails (desktop), a main image
 * area that slides between images, and a horizontal-scroll carousel
 * on mobile. Empty fallback shows a centered "Product Image" label.
 */
export function ProductGallery({
  productName,
  allImages,
  currentImageIndex,
  setCurrentImageIndex,
  imageScrollRef,
  handleImageScroll,
  scrollToImage,
  onOpenImageModal,
}: ProductGalleryProps) {
  const multi = allImages.length > 1;

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-4">
      {/* Desktop thumbnail column */}
      {multi && (
        <div className="hidden md:flex flex-col gap-2 w-[96px] shrink-0 max-h-[660px] overflow-y-auto">
          {allImages.map((image, index) => (
            <button
              key={image}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-[96px] h-[120px] shrink-0 rounded-sm overflow-hidden border cursor-pointer transition-all ${
                index === currentImageIndex
                  ? "border-text-primary"
                  : "border-transparent hover:border-border"
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - ${index + 1}`}
                width={96}
                height={120}
                quality={90}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div
        className={`group w-full ${allImages.length === 1 ? "md:w-full" : "md:w-[528px]"} md:h-[660px] bg-white rounded-none md:rounded-sm relative overflow-hidden`}
      >
        {allImages.length > 0 ? (
          <>
            <DesktopSlider
              productName={productName}
              allImages={allImages}
              currentImageIndex={currentImageIndex}
              onOpenImageModal={onOpenImageModal}
            />
            <MobileCarousel
              productName={productName}
              allImages={allImages}
              imageScrollRef={imageScrollRef}
              handleImageScroll={handleImageScroll}
              setCurrentImageIndex={setCurrentImageIndex}
              onOpenImageModal={onOpenImageModal}
            />

            {multi && (
              <>
                <ImageCounter current={currentImageIndex + 1} total={allImages.length} mobile />
                <ImageCounter current={currentImageIndex + 1} total={allImages.length} />
                <DesktopArrows allImages={allImages} setCurrentImageIndex={setCurrentImageIndex} />
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted">
            Product Image
          </div>
        )}
      </div>

      {/* Mobile thumbnail strip */}
      {multi && (
        <MobileThumbStrip
          productName={productName}
          allImages={allImages}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
          scrollToImage={scrollToImage}
        />
      )}
    </div>
  );
}

function DesktopSlider({
  productName,
  allImages,
  currentImageIndex,
  onOpenImageModal,
}: {
  productName: string;
  allImages: string[];
  currentImageIndex: number;
  onOpenImageModal: () => void;
}) {
  const single = allImages.length === 1;
  return (
    <div
      className={`hidden md:flex cursor-pointer h-[660px] transition-transform duration-300 ease-in-out ${single ? "w-full" : ""}`}
      style={
        single
          ? undefined
          : {
              width: `${528 * allImages.length}px`,
              transform: `translateX(-${currentImageIndex * 528}px)`,
            }
      }
      onClick={onOpenImageModal}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenImageModal();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Open image viewer"
    >
      {allImages.map((image, index) => (
        <div key={image} className={`${single ? "w-full" : "w-[528px]"} h-[660px] shrink-0`}>
          <Image
            src={image}
            alt={`${productName} - ${index + 1}`}
            width={single ? 640 : 528}
            height={660}
            quality={90}
            className="w-full h-full object-contain object-center"
          />
        </div>
      ))}
    </div>
  );
}

function MobileCarousel({
  productName,
  allImages,
  imageScrollRef,
  handleImageScroll,
  setCurrentImageIndex,
  onOpenImageModal,
}: {
  productName: string;
  allImages: string[];
  imageScrollRef: React.RefObject<HTMLDivElement | null>;
  handleImageScroll: () => void;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpenImageModal: () => void;
}) {
  return (
    <div
      ref={imageScrollRef}
      onScroll={handleImageScroll}
      className="flex md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-[472px]"
    >
      {allImages.map((image, index) => (
        <div
          key={image}
          className="relative shrink-0 w-full h-[472px] snap-center cursor-pointer"
          onClick={() => {
            setCurrentImageIndex(index);
            onOpenImageModal();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setCurrentImageIndex(index);
              onOpenImageModal();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Open image ${index + 1} of ${allImages.length}`}
        >
          <Image
            src={image}
            alt={`${productName} - ${index + 1}`}
            fill
            sizes="100vw"
            quality={90}
            className="w-full h-full object-contain object-center"
          />
        </div>
      ))}
    </div>
  );
}
