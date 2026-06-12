"use client";

import { ProductCardDefault } from "./_card/ProductCardDefault";
import { ProductCardHorizontal } from "./_card/ProductCardHorizontal";
import { ProductCardSmall } from "./_card/ProductCardSmall";

import type { Product } from "@/types/database";

interface ProductCardBaseProps {
  product?: Product;
}

interface DefaultVariantProps extends ProductCardBaseProps {
  variant?: "default";
  rank?: number;
  imageHeight?: number;
  fillParent?: boolean;
  compactImage?: boolean;
}

interface SmallVariantProps extends ProductCardBaseProps {
  variant: "small";
  product: Product;
}

interface HorizontalVariantProps extends ProductCardBaseProps {
  variant: "horizontal";
  product: Product;
  rank: number;
}

type ProductCardProps = DefaultVariantProps | SmallVariantProps | HorizontalVariantProps;

export const ProductCard = (props: ProductCardProps) => {
  if (props.variant === "small") {
    return <ProductCardSmall product={props.product} />;
  }
  if (props.variant === "horizontal") {
    return <ProductCardHorizontal product={props.product} rank={props.rank} />;
  }
  return (
    <ProductCardDefault
      product={props.product}
      rank={props.rank}
      imageHeight={props.imageHeight}
      fillParent={props.fillParent}
      compactImage={props.compactImage}
    />
  );
};
