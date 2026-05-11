import { use } from "react";
import { ProductForm } from "@/components/product";

export default function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProductForm id={id} />;
}
