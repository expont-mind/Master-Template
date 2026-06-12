import {
  Section,
  TimedSaleSection,
  BrandLogoSection,
  RotatingPromoBanner,
} from "@/components/home";
import { ROUTES } from "@/lib/utils/constants";

import type { PromoBanner, Brand } from "@/app/_lib/homeData";
import type { Product, Category } from "@/types/database";

interface HomeCategorySectionsProps {
  featuredCategories: Category[];
  productsByCategory: Map<string, Product[]>;
  withImages: (products: Product[]) => Product[];
  brands: Brand[];
  brandSectionTitle: string;
  brandSectionIcon: string;
  promoSlots: PromoBanner[][];
}

function renderCategorySection(
  category: Category,
  products: Product[],
  withImages: (p: Product[]) => Product[],
) {
  const isTimedSale = category.slug === "hugatsaatai-hymdral";
  if (isTimedSale) {
    return (
      <TimedSaleSection
        key={category.id}
        products={withImages(products)}
        href={ROUTES.CATEGORY(category.slug)}
        iconSrc={category.image || undefined}
      />
    );
  }
  return (
    <Section
      key={category.id}
      title={category.name}
      iconSrc={category.image || undefined}
      href={ROUTES.CATEGORY(category.slug)}
      products={withImages(products)}
    />
  );
}

export function HomeCategorySections({
  featuredCategories,
  productsByCategory,
  withImages,
  brands,
  brandSectionTitle,
  brandSectionIcon,
  promoSlots,
}: HomeCategorySectionsProps) {
  return (
    <>
      {featuredCategories.map((category, index) => {
        const products = productsByCategory.get(category.id) || [];
        if (products.length === 0) return null;

        const categorySection = renderCategorySection(category, products, withImages);

        // Show brands section after the first category
        if (index === 0) {
          return (
            <div key={category.id}>
              {categorySection}
              <BrandLogoSection
                brands={brands}
                title={brandSectionTitle || undefined}
                iconSrc={brandSectionIcon || undefined}
              />
            </div>
          );
        }

        // Show promo banner at index 2 (first promo banner)
        if (index === 2 && promoSlots[0]) {
          return (
            <div key={category.id}>
              <RotatingPromoBanner banners={promoSlots[0]} />
              {categorySection}
            </div>
          );
        }

        // Show promo banner at index 7 (second promo banner - after 4 sections)
        if (index === 7 && promoSlots[1]) {
          return (
            <div key={category.id}>
              <RotatingPromoBanner banners={promoSlots[1]} />
              {categorySection}
            </div>
          );
        }

        return categorySection;
      })}
    </>
  );
}
