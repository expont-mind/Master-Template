import { createClient } from "@/lib/supabase/client";

import type { AddressWithId, ContactData, SavedAddress } from "./useCheckout";

interface FetchUserCheckoutDataResult {
  allAddresses: AddressWithId[];
  defaultAddress: AddressWithId | null;
  contactData: ContactData | null;
}

export async function fetchUserCheckoutData(): Promise<FetchUserCheckoutDataResult | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: addresses } = await supabase
    .from("addresses")
    .select()
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  let allAddresses: AddressWithId[] = [];
  let defaultAddress: AddressWithId | null = null;
  if (addresses && addresses.length > 0) {
    allAddresses = addresses.map((a) => ({
      id: a.id,
      name: a.name ?? "",
      city: a.city ?? "",
      district: a.district ?? "",
      sub_district: a.sub_district ?? "",
      detail: a.detail ?? "",
      is_default: a.is_default,
    }));
    defaultAddress = allAddresses.find((a) => a.is_default) || allAddresses[0];
  }

  const { data: userData } = await supabase
    .from("users")
    .select("first_name, last_name, primary_phone, secondary_phone")
    .eq("id", user.id)
    .maybeSingle();

  const contactData: ContactData | null = userData
    ? {
        firstName: userData.first_name ?? "",
        lastName: userData.last_name ?? "",
        phone1: (userData.primary_phone ?? "").replace(/^\+?976/, ""),
        phone2: (userData.secondary_phone ?? "").replace(/^\+?976/, ""),
      }
    : null;

  return { allAddresses, defaultAddress, contactData };
}

export async function upsertUserAddress(
  addressId: string | null,
  addr: SavedAddress,
): Promise<{ id: string } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // If marking as default, unset all other defaults first
  if (addr.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_default", true);
  }

  if (addressId) {
    await supabase
      .from("addresses")
      .update({
        name: addr.name,
        city: addr.city,
        district: addr.district,
        sub_district: addr.sub_district,
        detail: addr.detail,
        is_default: addr.is_default,
      })
      .eq("id", addressId);
    return { id: addressId };
  }

  const { data } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      name: addr.name,
      city: addr.city,
      district: addr.district,
      sub_district: addr.sub_district,
      detail: addr.detail,
      is_default: addr.is_default,
    })
    .select("id")
    .single();
  return data ? { id: data.id } : null;
}
