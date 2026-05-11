"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveContact } from "@/components/checkout/actions";

export interface SavedAddress {
  name: string;
  city: string;
  district: string;
  sub_district: string;
  detail: string;
  is_default: boolean;
}

export interface AddressWithId extends SavedAddress {
  id: string;
}

interface ContactInfo {
  lastName: string;
  firstName: string;
  phone1: string;
  phone2: string;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  phone1: string;
  phone2: string;
}

export function useCheckout() {
  const [addressSaved, setAddressSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addressData, setAddressData] = useState<SavedAddress | null>(null);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [allAddresses, setAllAddresses] = useState<AddressWithId[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all addresses
      const { data: addresses } = await supabase
        .from("addresses")
        .select()
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (addresses && addresses.length > 0) {
        const mapped: AddressWithId[] = addresses.map((a) => ({
          id: a.id,
          name: a.name ?? "",
          city: a.city ?? "",
          district: a.district ?? "",
          sub_district: a.sub_district ?? "",
          detail: a.detail ?? "",
          is_default: a.is_default,
        }));
        setAllAddresses(mapped);

        const defaultAddr = mapped.find((a) => a.is_default) || mapped[0];
        setAddressId(defaultAddr.id);
        setAddressData({
          name: defaultAddr.name,
          city: defaultAddr.city,
          district: defaultAddr.district,
          sub_district: defaultAddr.sub_district,
          detail: defaultAddr.detail,
          is_default: defaultAddr.is_default,
        });
        setAddressSaved(true);
      }

      // Fetch user contact info
      const { data: userData } = await supabase
        .from("users")
        .select("first_name, last_name, primary_phone, secondary_phone")
        .eq("id", user.id)
        .maybeSingle();

      if (userData) {
        setContactData({
          firstName: userData.first_name ?? "",
          lastName: userData.last_name ?? "",
          phone1: (userData.primary_phone ?? "").replace(/^\+?976/, ""),
          phone2: (userData.secondary_phone ?? "").replace(/^\+?976/, ""),
        });
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const saveAddress = useCallback(
    async (addr: SavedAddress) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

        setAllAddresses((prev) =>
          prev.map((a) => {
            if (a.id === addressId) return { ...a, ...addr };
            if (addr.is_default) return { ...a, is_default: false };
            return a;
          }),
        );
      } else {
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

        if (data) {
          setAddressId(data.id);
          setAllAddresses((prev) => {
            const updated = addr.is_default
              ? prev.map((a) => ({ ...a, is_default: false }))
              : prev;
            return [...updated, { id: data.id, ...addr }];
          });
        }
      }

      setAddressData(addr);
      setAddressSaved(true);
    },
    [addressId],
  );

  const editAddress = useCallback(() => {
    setAddressSaved(false);
  }, []);

  const editExistingAddress = useCallback((addr: AddressWithId) => {
    setAddressId(addr.id);
    setAddressData({
      name: addr.name,
      city: addr.city,
      district: addr.district,
      sub_district: addr.sub_district,
      detail: addr.detail,
      is_default: addr.is_default,
    });
    setAddressSaved(false);
  }, []);

  const selectAddress = useCallback((addr: AddressWithId) => {
    setAddressId(addr.id);
    setAddressData({
      name: addr.name,
      city: addr.city,
      district: addr.district,
      sub_district: addr.sub_district,
      detail: addr.detail,
      is_default: addr.is_default,
    });
    setAddressSaved(true);
  }, []);

  const addNewAddress = useCallback(() => {
    setAddressId(null);
    setAddressData(null);
    setAddressSaved(false);
  }, []);

  const syncToSupabase = useCallback(
    async (contact: ContactInfo): Promise<boolean> => {
      setSyncing(true);
      try {
        const result = await saveContact(contact);
        if (!result.success) {
          console.error("Contact save failed:", result.error);
          return false;
        }
        return true;
      } catch (err) {
        console.error("Checkout sync error:", err);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [],
  );

  return {
    addressData,
    contactData,
    addressSaved,
    allAddresses,
    addressId,
    loading,
    syncing,
    saveAddress,
    editAddress,
    editExistingAddress,
    selectAddress,
    addNewAddress,
    syncToSupabase,
  };
}
