"use client";

import { use } from "react";
import { ProductSalesDetail } from "@/components/analytics/business";

export default function ProductAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <ProductSalesDetail productId={id} />;
}
