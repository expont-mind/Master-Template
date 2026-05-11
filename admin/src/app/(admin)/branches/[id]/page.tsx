import { use } from "react";
import { BranchForm } from "@/components/branch";

export default function BranchEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BranchForm id={id} />;
}
