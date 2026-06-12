"use client";

import { useCallback, useEffect, useState } from "react";

import type { ModalField } from "@/components/checkout/constants";
import type { AddressWithId, ContactData, SavedAddress } from "@/lib/hooks/useCheckout";

interface UseCheckoutFormInput {
  addressData: SavedAddress | null;
  contactData: ContactData | null;
  saveAddress: (addr: SavedAddress) => Promise<void>;
  selectAddress: (addr: AddressWithId) => void;
  addNewAddress: () => void;
}

interface UseCheckoutFormReturn {
  addressName: string;
  city: string;
  district: string;
  khoroo: string;
  address: string;
  isDefault: boolean;
  setAddressName: (v: string) => void;
  setCity: (v: string) => void;
  setDistrict: (v: string) => void;
  setKhoroo: (v: string) => void;
  setAddress: (v: string) => void;
  setIsDefault: (v: boolean) => void;

  lastName: string;
  firstName: string;
  phone1: string;
  phone2: string;
  setLastName: (v: string) => void;
  setFirstName: (v: string) => void;
  setPhone1: (v: string) => void;
  setPhone2: (v: string) => void;

  openModal: ModalField;
  setOpenModal: (v: ModalField) => void;

  handleSelectAddress: (addr: AddressWithId) => void;
  handleAddNewAddress: () => void;
  handleSaveAddress: () => Promise<void>;
}

/**
 * Owns the editable form state of the checkout page:
 *   - Address fields (addressName, city, district, khoroo, address, isDefault)
 *   - Contact fields (lastName, firstName, phone1, phone2)
 *   - Modal selection state (openModal)
 *
 * Populates fields from Supabase via the addressData/contactData props (which
 * come from useCheckout). Composite handlers wrap saveAddress/selectAddress/
 * addNewAddress so the page never has to coordinate state + mutation calls.
 */
export function useCheckoutForm(input: UseCheckoutFormInput): UseCheckoutFormReturn {
  const [addressName, setAddressName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [khoroo, setKhoroo] = useState("");
  const [address, setAddress] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");

  const [openModal, setOpenModal] = useState<ModalField>(null);

  useEffect(() => {
    if (input.addressData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time prefill of form fields from saved Supabase address
      setAddressName(input.addressData.name || "");
      setCity(input.addressData.city);
      setDistrict(input.addressData.district);
      setKhoroo(input.addressData.sub_district);
      setAddress(input.addressData.detail);
      setIsDefault(input.addressData.is_default);
    }
  }, [input.addressData]);

  useEffect(() => {
    if (input.contactData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time prefill of form fields from saved Supabase contact
      setLastName(input.contactData.lastName);
      setFirstName(input.contactData.firstName);
      setPhone1(input.contactData.phone1);
      setPhone2(input.contactData.phone2);
    }
  }, [input.contactData]);

  const handleSelectAddress = useCallback(
    (addr: AddressWithId) => {
      input.selectAddress(addr);
      setAddressName(addr.name);
      setCity(addr.city);
      setDistrict(addr.district);
      setKhoroo(addr.sub_district);
      setAddress(addr.detail);
      setIsDefault(addr.is_default);
    },
    [input],
  );

  const handleAddNewAddress = useCallback(() => {
    setAddressName("");
    setCity("");
    setDistrict("");
    setKhoroo("");
    setAddress("");
    setIsDefault(false);
    input.addNewAddress();
  }, [input]);

  const handleSaveAddress = useCallback(async () => {
    await input.saveAddress({
      name: addressName,
      city,
      district,
      sub_district: khoroo,
      detail: address,
      is_default: isDefault,
    });
  }, [input, addressName, city, district, khoroo, address, isDefault]);

  return {
    addressName,
    city,
    district,
    khoroo,
    address,
    isDefault,
    setAddressName,
    setCity,
    setDistrict,
    setKhoroo,
    setAddress,
    setIsDefault,

    lastName,
    firstName,
    phone1,
    phone2,
    setLastName,
    setFirstName,
    setPhone1,
    setPhone2,

    openModal,
    setOpenModal,

    handleSelectAddress,
    handleAddNewAddress,
    handleSaveAddress,
  };
}
