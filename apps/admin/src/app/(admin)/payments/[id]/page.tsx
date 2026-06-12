import { use } from "react";

import { PaymentDetails } from "@/components/payment";

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PaymentDetails id={id} />;
}
