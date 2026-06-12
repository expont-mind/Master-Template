import { use } from "react";

import { ProductForm } from "@/components/product";

export default function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const { duplicate } = use(searchParams);
  return <ProductForm id="new" duplicateId={duplicate} />;
}
