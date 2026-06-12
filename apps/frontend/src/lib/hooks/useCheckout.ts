"use client";

import { useCallback, useEffect, useState } from "react";

import { saveContact } from "@/components/checkout/actions";
import { log } from "@/lib/utils/logger";

import { fetchUserCheckoutData, upsertUserAddress } from "./_checkoutAddress";

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

function toSavedAddress(addr: AddressWithId): SavedAddress {
  return {
    name: addr.name,
    city: addr.city,
    district: addr.district,
    sub_district: addr.sub_district,
    detail: addr.detail,
    is_default: addr.is_default,
  };
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
    let cancelled = false;
    fetchUserCheckoutData()
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setLoading(false);
          return;
        }
        const { allAddresses: addrs, defaultAddress, contactData: cd } = result;
        if (addrs.length > 0 && defaultAddress) {
          setAllAddresses(addrs);
          setAddressId(defaultAddress.id);
          setAddressData(toSavedAddress(defaultAddress));
          setAddressSaved(true);
        }
        if (cd) setContactData(cd);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveAddress = useCallback(
    async (addr: SavedAddress) => {
      const result = await upsertUserAddress(addressId, addr);
      if (!result) return;

      if (addressId) {
        setAllAddresses((prev) =>
          prev.map((a) => {
            if (a.id === addressId) return { ...a, ...addr };
            if (addr.is_default) return { ...a, is_default: false };
            return a;
          }),
        );
      } else {
        setAddressId(result.id);
        setAllAddresses((prev) => {
          const updated = addr.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev;
          return [...updated, { id: result.id, ...addr }];
        });
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
    setAddressData(toSavedAddress(addr));
    setAddressSaved(false);
  }, []);

  const selectAddress = useCallback((addr: AddressWithId) => {
    setAddressId(addr.id);
    setAddressData(toSavedAddress(addr));
    setAddressSaved(true);
  }, []);

  const addNewAddress = useCallback(() => {
    setAddressId(null);
    setAddressData(null);
    setAddressSaved(false);
  }, []);

  const syncToSupabase = useCallback(async (contact: ContactInfo): Promise<boolean> => {
    setSyncing(true);
    try {
      const result = await saveContact(contact);
      if (!result.success) {
        log.error("contact_save_failed", { error: result.error });
        return false;
      }
      return true;
    } catch (err) {
      log.error("checkout_sync_unexpected_error", err);
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

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
