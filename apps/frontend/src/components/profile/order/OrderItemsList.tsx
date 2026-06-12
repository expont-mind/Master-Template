"use client";

import Image from "next/image";
import Link from "next/link";

import { Calendar, Tag } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/formatters";

import { formatDateShort } from "./_date-helpers";

import type { ProfileOrder } from "@/app/profile/page";

type OrderItem = ProfileOrder["items"][number];

interface OrderItemsListProps {
  items: OrderItem[];
  createdAt: string;
}

const ProductThumbnail = ({ item }: { item: OrderItem }) => (
  <div className="w-[60px] h-[60px] sm:w-[76px] sm:h-[76px] rounded-[4px] border border-border-light bg-surface shrink-0 overflow-hidden relative">
    {item.products?.images?.[0] && (
      <Image
        src={item.products.images[0]}
        alt={item.products.name ?? ""}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 60px, 76px"
        quality={90}
      />
    )}
  </div>
);

const PriceBlock = ({ item }: { item: OrderItem }) => {
  const originalPrice = item.products?.price ?? item.price;
  const hasDiscount = item.price < originalPrice;
  return (
    <div className="flex items-baseline gap-1">
      <p className="text-text-primary font-medium text-xs font-manrope leading-5 tracking-[-0.48px]">
        {formatPrice(item.price)}
      </p>
      {hasDiscount && (
        <p className="text-text-muted font-normal text-xs font-manrope leading-4 line-through">
          {formatPrice(originalPrice)}
        </p>
      )}
    </div>
  );
};

const OrderItemsRow = ({ item }: { item: OrderItem }) => (
  <Link
    href={ROUTES.PRODUCT(item.products?.slug ?? item.product_id)}
    className="flex gap-3 sm:gap-10 items-start"
  >
    <div className="flex-1 flex gap-2 items-start">
      <ProductThumbnail item={item} />
      <div className="flex-1 flex flex-col min-w-0">
        <p className="text-text-primary font-normal text-sm font-manrope leading-5 line-clamp-2 hover:underline">
          {item.products?.name ?? "Бүтээгдэхүүн"}
        </p>
        {item.variant_name && (
          <p className="text-text-secondary font-normal text-xs font-manrope leading-4 truncate py-0.5">
            {item.variant_name}
          </p>
        )}
        <PriceBlock item={item} />
      </div>
    </div>
    <div className="flex items-center gap-0.5 pr-1 text-text-primary font-normal text-sm font-manrope leading-5">
      <span>{item.quantity}</span>
      <span>x</span>
    </div>
  </Link>
);

export const OrderItemsList = ({ items, createdAt }: OrderItemsListProps) => {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-primary font-medium text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
        Худалдан авалт
      </p>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          <Calendar />
          <p className="text-text-secondary font-normal text-xs font-manrope leading-4">
            {formatDateShort(createdAt)}
          </p>
        </div>
        <p className="text-text-secondary font-normal text-xs font-manrope leading-4">·</p>
        <div className="flex items-center gap-0.5">
          <Tag />
          <p className="text-text-secondary font-normal text-xs font-manrope leading-4">
            {items.length}ш
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <OrderItemsRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
