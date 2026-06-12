import Image from "next/image";
import Link from "next/link";

import { ChevronRightProduct } from "@/components/svg";

import type { ProductBrand } from "@/lib/queries/products";

interface ProductBrandLinkProps {
  brand?: ProductBrand | null;
}

/** Brand chip with logo + name linking to the brand listing page. */
export function ProductBrandLink({ brand }: ProductBrandLinkProps) {
  if (!brand) return null;
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="flex items-center gap-2.5 group transition-all duration-200 w-fit"
    >
      <div className="w-[34px] h-[34px] flex items-center justify-center border border-border-light rounded-full bg-surface overflow-hidden">
        {brand.logo_url && (
          <Image
            src={brand.logo_url}
            alt={brand.name}
            width={30}
            height={30}
            quality={90}
            className="object-contain"
          />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <p className="text-text-primary font-medium text-base font-manrope group-hover:text-text-primary/80 duration-200">
          {brand.name}
        </p>
        <ChevronRightProduct />
      </div>
    </Link>
  );
}
