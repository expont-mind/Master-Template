"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Slash } from "@/components/svg";
import type { CategoryWithChildren } from "@/lib/queries/products";

interface BreadcrumbsProps {
  breadcrumbPath: CategoryWithChildren[] | null;
}

export function Breadcrumbs({ breadcrumbPath }: BreadcrumbsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCrumbClick = (slug: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleRootClick = () => {
    router.push("/products", { scroll: false });
  };

  return (
    <div className="flex items-center gap-1.5 py-1 flex-wrap">
      <button
        onClick={handleRootClick}
        className="text-[#64748B] font-normal text-sm font-manrope hover:text-[#020617] transition-all cursor-pointer"
      >
        Категори
      </button>
      {breadcrumbPath?.map((crumb, index) => (
        <span key={crumb.id} className="flex items-center gap-1.5">
          <Slash />
          {index === breadcrumbPath.length - 1 ? (
            <p className="text-[#020617] font-normal text-sm font-manrope whitespace-nowrap max-w-[70px] truncate md:max-w-full md:truncate-none">
              {crumb.name}
            </p>
          ) : (
            <button
              onClick={() => handleCrumbClick(crumb.slug)}
              className="text-[#64748B] font-normal text-sm font-manrope hover:text-[#020617] whitespace-nowrap max-w-[70px] truncate md:max-w-full md:truncate-none transition-all cursor-pointer"
            >
              {crumb.name}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
