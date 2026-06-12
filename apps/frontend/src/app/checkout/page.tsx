"use client";

import { useState } from "react";

import { AddressMultiStepModal } from "@/components/checkout/AddressMultiStepModal";
import { AddressSelectModal } from "@/components/checkout/AddressSelectModal";
import { useCheckout } from "@/lib/hooks/useCheckout";
import { DELIVERY_ZONES_CONFIG } from "@/lib/utils/brand-config";
import { useCartStore } from "@/stores/cart-store";

import { CheckoutBreadcrumb } from "./_components/CheckoutBreadcrumb";
import { CheckoutFormsSection } from "./_components/CheckoutFormsSection";
import { CheckoutPaymentModal } from "./_components/CheckoutPaymentModal";
import { FreeOrderSuccessModal } from "./_components/FreeOrderSuccessModal";
import { useCartItemViews } from "./_hooks/useCartItemViews";
import { useCheckoutData } from "./_hooks/useCheckoutData";
import { useCheckoutForm } from "./_hooks/useCheckoutForm";
import { useCheckoutValidation } from "./_hooks/useCheckoutValidation";
import { usePaymentFlow } from "./_hooks/usePaymentFlow";
import { calculateCheckoutTotals, resolveActiveZone } from "./_lib/pricing-calculator";

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-red-800 text-sm font-manrope">
      {message}
    </div>
  );
}

export default function CheckoutPage() {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const selectedCoupon = useCartStore((s) => s.selectedCoupon);
  const selectedPoints = useCartStore((s) => s.selectedPoints);

  const {
    addressData,
    contactData,
    addressSaved,
    allAddresses,
    addressId,
    loading,
    syncing,
    saveAddress,
    selectAddress,
    editExistingAddress,
    addNewAddress,
    syncToSupabase,
  } = useCheckout();

  const form = useCheckoutForm({
    addressData,
    contactData,
    saveAddress,
    selectAddress,
    addNewAddress,
  });

  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { items, orderItemsPayload } = useCartItemViews(cartItems);

  const { deliveryZones, productCategoryMap, cartWarning } = useCheckoutData({
    cartItems,
    orderItemsPayload,
  });

  const activeZone = resolveActiveZone(form.city, deliveryZones, DELIVERY_ZONES_CONFIG);
  const { deliveryFee, couponDiscount, pointDiscount, totalPayable } = calculateCheckoutTotals({
    lineItems: items,
    cartItems,
    productCategoryMap,
    coupon: selectedCoupon,
    selectedPoints,
    activeZone,
  });

  const payment = usePaymentFlow({
    totalPayable,
    couponDiscount,
    pointDiscount,
    selectedCoupon,
    contact: { firstName: form.firstName, lastName: form.lastName },
    address: {
      city: form.city,
      district: form.district,
      sub_district: form.khoroo,
      detail: form.address,
    },
    phone1: form.phone1,
    phone2: form.phone2,
    orderItemsPayload,
    syncToSupabase,
    onSuccess: clearCart,
  });

  const { canPay } = useCheckoutValidation({
    addressSaved,
    city: form.city,
    district: form.district,
    khoroo: form.khoroo,
    address: form.address,
    lastName: form.lastName,
    firstName: form.firstName,
    phone1: form.phone1,
    itemCount: items.length,
    cartWarning,
    isCreatingInvoice: payment.isCreatingInvoice,
    deliveryZonesLoaded: deliveryZones.length > 0,
  });

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col gap-0 md:gap-5 max-w-[1064px] w-full px-4 xl:px-0 pb-10">
        <CheckoutBreadcrumb />

        {cartWarning && <WarningBanner message={cartWarning} />}
        {payment.invoiceError && !payment.showPaymentModal && (
          <WarningBanner message={payment.invoiceError} />
        )}

        <CheckoutFormsSection
          addressName={form.addressName}
          city={form.city}
          district={form.district}
          khoroo={form.khoroo}
          address={form.address}
          isDefault={form.isDefault}
          addressSaved={addressSaved}
          onAddressNameChange={form.setAddressName}
          onAddressChange={form.setAddress}
          onIsDefaultChange={form.setIsDefault}
          onOpenModal={form.setOpenModal}
          onSaveAddress={form.handleSaveAddress}
          onEditAddress={() => setShowAddressModal(true)}
          lastName={form.lastName}
          firstName={form.firstName}
          phone1={form.phone1}
          phone2={form.phone2}
          onLastNameChange={form.setLastName}
          onFirstNameChange={form.setFirstName}
          onPhone1Change={form.setPhone1}
          onPhone2Change={form.setPhone2}
          items={items}
          canPay={canPay}
          syncing={syncing}
          loading={loading}
          deliveryFee={deliveryFee}
          deliveryZones={deliveryZones}
          onStartPayment={payment.startPayment}
          selectedCoupon={selectedCoupon}
          couponDiscount={couponDiscount}
          pointDiscount={pointDiscount}
        />
      </div>

      <AddressMultiStepModal
        isOpen={form.openModal !== null}
        onClose={() => form.setOpenModal(null)}
        initialStep={form.openModal}
        city={form.city}
        setCity={form.setCity}
        district={form.district}
        setDistrict={form.setDistrict}
        khoroo={form.khoroo}
        setKhoroo={form.setKhoroo}
      />

      <AddressSelectModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        addresses={allAddresses}
        selectedAddressId={addressId}
        onSelect={form.handleSelectAddress}
        onEdit={editExistingAddress}
        onAddNew={form.handleAddNewAddress}
      />

      <CheckoutPaymentModal
        payment={payment}
        totalPayable={totalPayable}
        orderItemsPayload={orderItemsPayload}
        phone1={form.phone1}
        selectedCoupon={selectedCoupon}
        couponDiscount={couponDiscount}
        pointDiscount={pointDiscount}
      />

      {payment.freeOrderSuccess && <FreeOrderSuccessModal />}
    </div>
  );
}
