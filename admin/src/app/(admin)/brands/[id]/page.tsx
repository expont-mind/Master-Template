import { use } from "react";
import { BrandEditForm } from "@/components/brand";

export default function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BrandEditForm id={id} />;
}
