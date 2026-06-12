"use client";

interface UseCheckoutValidationInput {
  addressSaved: boolean;
  city: string;
  district: string;
  khoroo: string;
  address: string;
  lastName: string;
  firstName: string;
  phone1: string;
  itemCount: number;
  cartWarning: string | null;
  isCreatingInvoice: boolean;
  deliveryZonesLoaded: boolean;
}

interface UseCheckoutValidationReturn {
  addressValid: boolean;
  canPay: boolean;
}

/**
 * Derive the two checkout gating booleans:
 *   - addressValid: address is saved OR all 4 required fields are filled
 *   - canPay: every precondition holds (items present, no cart warning, not
 *     currently creating an invoice, address valid, delivery zones loaded,
 *     contact name + primary phone filled).
 *
 * Plain function under the hood — wrapped as a hook for call-site uniformity
 * with the other checkout hooks, and to give a stable name to the concern.
 */
export function useCheckoutValidation(
  input: UseCheckoutValidationInput,
): UseCheckoutValidationReturn {
  const addressValid =
    input.addressSaved ||
    (input.city !== "" &&
      input.district !== "" &&
      input.khoroo !== "" &&
      input.address.trim() !== "");

  const canPay =
    input.itemCount > 0 &&
    !input.cartWarning &&
    !input.isCreatingInvoice &&
    addressValid &&
    input.deliveryZonesLoaded &&
    input.lastName.trim() !== "" &&
    input.firstName.trim() !== "" &&
    input.phone1.trim() !== "";

  return { addressValid, canPay };
}
