import { use } from "react";
import { BankAccountForm } from "@/components/bank-account";

export default function BankAccountEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BankAccountForm id={id} />;
}
