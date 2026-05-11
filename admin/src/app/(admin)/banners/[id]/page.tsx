import { use } from "react";
import { BannerForm } from "@/components/banner";

export default function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BannerForm id={id} />;
}
