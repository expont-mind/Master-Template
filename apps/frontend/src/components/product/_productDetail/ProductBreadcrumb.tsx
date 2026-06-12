import Link from "next/link";

import { Slash } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";

import type { ProductCategory } from "@/lib/queries/products";

interface ProductBreadcrumbProps {
  categoryPath?: ProductCategory[];
}

/** Top breadcrumb shown only on md+ widths: Категори / cat / .../ leaf. */
export function ProductBreadcrumb({ categoryPath }: ProductBreadcrumbProps) {
  return (
    <div className="py-4 hidden md:flex items-center gap-1.5 flex-wrap">
      <Link
        href="/products"
        prefetch={true}
        className="cursor-pointer text-text-secondary font-normal text-sm font-manrope hover:text-text-primary transition-colors duration-200"
      >
        Категори
      </Link>
      {categoryPath?.map((cat, index) => {
        const isLast = index === (categoryPath.length ?? 0) - 1;
        return (
          <span key={cat.id} className="flex items-center gap-1.5">
            <Slash />
            <Link
              href={ROUTES.CATEGORY(cat.slug)}
              prefetch={true}
              className={`cursor-pointer font-normal text-sm font-manrope transition-colors duration-200 ${isLast ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
            >
              {cat.name}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
