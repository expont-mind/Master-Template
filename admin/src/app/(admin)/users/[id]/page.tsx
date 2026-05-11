import { use } from "react";
import { UserDetails } from "@/components/user";

export default function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <UserDetails id={id} />;
}
