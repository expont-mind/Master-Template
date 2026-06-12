"use client";

import { ImagesSectionDesktop } from "./_additionalDetails/ImagesSectionDesktop";
import { ImagesSectionMobile } from "./_additionalDetails/ImagesSectionMobile";
import { buildSpecs } from "./_additionalDetails/specs";
import { SpecsSectionDesktop } from "./_additionalDetails/SpecsSectionDesktop";
import { SpecsSectionMobile } from "./_additionalDetails/SpecsSectionMobile";

interface ProductDetail {
  id: string;
  type: string;
  content: string;
  sort_order: number;
}

interface RichDescription {
  content: string | null;
  images: string[];
}

interface AdditionalDetailsProps {
  productName?: string;
  details?: ProductDetail[];
  richDescription?: RichDescription;
  middleSlot?: React.ReactNode;
}

/**
 * Composes the "Дэлгэрэнгүй тайлбар" specs table and "Зурган тайлбар"
 * image gallery, with separate mobile/desktop variants for each because
 * the expand/collapse measurement, gradient, and label sizes differ.
 *
 * Decomposed into _additionalDetails/* sub-components — each section
 * owns its own state for measurement + expansion.
 */
export const AdditionalDetails = ({
  productName,
  details,
  richDescription,
  middleSlot,
}: AdditionalDetailsProps) => {
  const specs = buildSpecs(productName, details);
  const richImages = richDescription?.images ?? [];
  const hasRichImages = richImages.length > 0;

  if (specs.length === 0 && !hasRichImages) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {specs.length > 0 && <SpecsSectionMobile specs={specs} />}
      {specs.length > 0 && <SpecsSectionDesktop specs={specs} />}

      <div className="w-full h-2 bg-border-light block md:hidden" />

      {middleSlot}

      {hasRichImages && <ImagesSectionMobile images={richImages} />}
      {hasRichImages && <ImagesSectionDesktop images={richImages} />}
    </div>
  );
};
