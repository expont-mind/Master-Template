import { use } from "react";

import { OrderDetails } from "@/components/order";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderDetails id={id} />;
}
