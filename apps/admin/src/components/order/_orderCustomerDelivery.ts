// Pure helpers for OrderCustomerDeliveryCard. Resolves display values to keep
// the JSX render free of conditional chains and reduce cyclomatic complexity.

import { DELIVERY_ZONES_CONFIG } from "@/lib/utils/brand-config";

import type { UserAddress } from "./types";

interface OrderAddress {
  city: string | null;
  district: string | null;
  sub_district: string | null;
  detail: string | null;
}

interface UserSnapshot {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  primary_phone: string | null;
  secondary_phone: string | null;
  addresses: UserAddress[];
}

export interface ResolvedDelivery {
  zoneLabel: string;
  districtLine: string | null;
  detailLine: string | null;
  hasAddress: boolean;
}

function hasAnyOrderAddressField(addr: OrderAddress | null | undefined): boolean {
  if (!addr) return false;
  return Boolean(addr.city || addr.district || addr.detail);
}

function pickUserAddress(user: UserSnapshot | null): UserAddress | null {
  const addresses = user?.addresses;
  if (!addresses || addresses.length === 0) return null;
  const defaultAddress = addresses.find((a) => a.is_default);
  return defaultAddress ?? addresses[0] ?? null;
}

function pickAddress(
  user: UserSnapshot | null,
  orderAddress: OrderAddress | null | undefined,
): OrderAddress | UserAddress | null {
  if (hasAnyOrderAddressField(orderAddress) && orderAddress) return orderAddress;
  return pickUserAddress(user);
}

function formatDistrictLine(district: string | null, subDistrict: string | null): string | null {
  if (!district) return null;
  if (subDistrict) return `${district}, ${subDistrict}`;
  return district;
}

export function resolveDeliveryDisplay(
  user: UserSnapshot | null,
  orderAddress: OrderAddress | null | undefined,
): ResolvedDelivery {
  const address = pickAddress(user, orderAddress);

  if (!address) {
    return {
      zoneLabel: "",
      districtLine: null,
      detailLine: null,
      hasAddress: false,
    };
  }

  return {
    zoneLabel: address.city || DELIVERY_ZONES_CONFIG.capital,
    districtLine: formatDistrictLine(address.district, address.sub_district),
    detailLine: address.detail || null,
    hasAddress: true,
  };
}

export function resolveCustomerDisplayName(user: UserSnapshot | null): string {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  if (fullName) return fullName;
  const idFragment = user?.id?.slice(0, 4).toUpperCase() || "XXXX";
  return `Зочин (${idFragment})`;
}
