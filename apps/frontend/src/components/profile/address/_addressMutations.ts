import { createClient } from "@/lib/supabase/client";

export async function setDefaultAddress(addressId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Remove default from all addresses, then set the new default.
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);

  await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);
}

export async function deleteAddress(addressId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("addresses").delete().eq("id", addressId);
}
