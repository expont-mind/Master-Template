import { use } from "react";
import { AdsForm } from "@/components/ads";

export default function AdsEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AdsForm id={id} />;
}
