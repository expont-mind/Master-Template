"use client";

import Image from "next/image";
import Link from "next/link";

import { ChevronRightProduct } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";

import type { CategoryWithChildren } from "@/lib/queries/products";

interface CategoryAccordionItemProps {
  category: CategoryWithChildren;
  isLast: boolean;
  onClose: () => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

export function CategoryAccordionItem({
  category,
  isLast,
  onClose,
  registerRef,
}: CategoryAccordionItemProps) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div ref={(el) => registerRef(category.id, el)}>
      {/* Category header */}
      <Link
        href={ROUTES.CATEGORY(category.slug)}
        onClick={onClose}
        className="flex items-center justify-between px-4 py-0.5 bg-white"
      >
        <div className="flex items-center gap-1">
          {category.image ? (
            <div className="relative w-9 h-9 rounded overflow-hidden shrink-0">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-base">📦</span>
            </div>
          )}
          <span className="text-text-primary font-medium text-base font-manrope line-clamp-1 w-full">
            {category.name}
          </span>
        </div>
        <ChevronRightProduct />
      </Link>

      {/* Children items */}
      {hasChildren && (
        <div className="flex flex-col">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={ROUTES.CATEGORY(child.slug)}
              onClick={onClose}
              className="px-6 py-2.5 text-text-primary font-normal text-sm font-manrope whitespace-nowrap truncate"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Divider between groups */}
      {!isLast && <div className="h-px bg-border mx-6 my-2" />}
    </div>
  );
}
