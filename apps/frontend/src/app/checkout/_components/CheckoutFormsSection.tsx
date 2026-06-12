"use client";

import { ContactForm } from "@/components/checkout/ContactForm";
import { DeliveryAddressForm } from "@/components/checkout/DeliveryAddressForm";
import { PaymentSummary } from "@/components/checkout/PaymentSummary";
import { DELIVERY_ZONES_CONFIG } from "@/lib/utils/brand-config";

import type { CartItem, ModalField } from "@/components/checkout/constants";
import type { SelectedCoupon } from "@/stores/cart-store";

interface DeliveryZone {
  name: string;
  estimated_days_min: number;
  estimated_days_max: number;
}

interface CheckoutFormsSectionProps {
  addressName: string;
  city: string;
  district: string;
  khoroo: string;
  address: string;
  isDefault: boolean;
  addressSaved: boolean;
  onAddressNameChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onIsDefaultChange: (v: boolean) => void;
  onOpenModal: (v: ModalField) => void;
  onSaveAddress: () => void;
  onEditAddress: () => void;

  lastName: string;
  firstName: string;
  phone1: string;
  phone2: string;
  onLastNameChange: (v: string) => void;
  onFirstNameChange: (v: string) => void;
  onPhone1Change: (v: string) => void;
  onPhone2Change: (v: string) => void;

  items: CartItem[];
  canPay: boolean;
  syncing: boolean;
  loading: boolean;
  deliveryFee: number;
  deliveryZones: DeliveryZone[];
  onStartPayment: () => void;
  selectedCoupon: SelectedCoupon | null;
  couponDiscount: number;
  pointDiscount: number;
}

export function CheckoutFormsSection(props: CheckoutFormsSectionProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start">
      <div className="w-full flex-1 flex flex-col gap-2 md:gap-8 pr-0 md:pr-16 lg:pr-32">
        <DeliveryAddressForm
          addressName={props.addressName}
          city={props.city}
          district={props.district}
          khoroo={props.khoroo}
          address={props.address}
          isDefault={props.isDefault}
          addressSaved={props.addressSaved}
          onAddressNameChange={props.onAddressNameChange}
          onAddressChange={props.onAddressChange}
          onIsDefaultChange={props.onIsDefaultChange}
          onOpenModal={props.onOpenModal}
          onSave={props.onSaveAddress}
          onEdit={props.onEditAddress}
        />
        <ContactForm
          lastName={props.lastName}
          firstName={props.firstName}
          phone1={props.phone1}
          phone2={props.phone2}
          addressSaved={props.addressSaved}
          onLastNameChange={props.onLastNameChange}
          onFirstNameChange={props.onFirstNameChange}
          onPhone1Change={props.onPhone1Change}
          onPhone2Change={props.onPhone2Change}
        />
      </div>
      <PaymentSummary
        items={props.items}
        canPay={props.canPay}
        syncing={props.syncing}
        loading={props.loading}
        deliveryFee={props.deliveryFee}
        deliveryFeeResolved={props.deliveryZones.length > 0 && props.city !== ""}
        onPayment={props.onStartPayment}
        selectedCoupon={props.selectedCoupon}
        couponDiscount={props.couponDiscount}
        pointDiscount={props.pointDiscount}
        ubZone={props.deliveryZones.find((z) => z.name === DELIVERY_ZONES_CONFIG.capital)}
        regionalZone={props.deliveryZones.find((z) => z.name === DELIVERY_ZONES_CONFIG.rural)}
      />
    </div>
  );
}
