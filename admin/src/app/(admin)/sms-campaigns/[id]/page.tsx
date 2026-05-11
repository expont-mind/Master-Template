import { use } from "react";
import { SmsCampaignForm } from "@/components/sms-campaign";

export default function EditSmsCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SmsCampaignForm id={id} />;
}
