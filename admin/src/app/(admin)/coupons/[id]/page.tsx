import { use } from "react";
import { CouponForm } from "@/components/coupon";

export default function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CouponForm id={id} />;
}
