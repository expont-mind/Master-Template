import { Section } from "@/components/product/Section";
import { ROUTES } from "@/lib/utils/constants";

import type { Product } from "@/types/database";

interface RelatedProductsSectionProps {
  products: Product[];
  /** Slug of the leaf category, used to build the "see more" link. */
  categorySlug?: string;
  /** "desktop" hides on mobile, "mobile" hides on desktop. */
  visibility: "mobile" | "desktop";
}

/**
 * "Төстэй бүтээгдэхүүн" carousel. Rendered twice on the page — once
 * inline on desktop (inside AdditionalDetails middleSlot) and once at
 * the very bottom on mobile so it stays out of the scroll spy.
 */
export function RelatedProductsSection({
  products,
  categorySlug,
  visibility,
}: RelatedProductsSectionProps) {
  const wrapperClass =
    visibility === "desktop"
      ? "hidden md:block w-full max-w-[640px]"
      : "md:hidden w-full max-w-[640px]";

  return (
    <div className={wrapperClass}>
      <Section
        title="Төстэй бүтээгдэхүүн"
        href={categorySlug ? ROUTES.CATEGORY(categorySlug) : ROUTES.PRODUCTS}
        products={products}
      />
    </div>
  );
}
