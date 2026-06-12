import { use } from "react";

import { ReviewDetails } from "@/components/review";

export default function ReviewDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReviewDetails id={id} />;
}
