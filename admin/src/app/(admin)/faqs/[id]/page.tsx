import { use } from "react";
import { FaqForm } from "@/components/faq";

export default function FAQEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FaqForm id={id} />;
}
