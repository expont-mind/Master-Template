"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Slash, Success } from "@/components/svg";
import { DeliveryAddressForm } from "@/components/checkout/DeliveryAddressForm";
import { ContactForm } from "@/components/checkout/ContactForm";
import { PaymentSummary } from "@/components/checkout/PaymentSummary";
import {
  PaymentModal,
  type PaymentMethod,
} from "@/components/checkout/PaymentModal";
import { AddressSelectModal } from "@/components/checkout/AddressSelectModal";
import { AddressMultiStepModal } from "@/components/checkout/AddressMultiStepModal";
import {
  type ModalField,
  type CartItem,
} from "../../components/checkout/constants";
import { useCheckout } from "@/lib/hooks/useCheckout";
import { useCartStore } from "@/stores/cart-store";
import {
  createCheckoutInvoice,
  createLendMNCheckoutInvoice,
  createStorePayCheckoutInvoice,
  createFreeOrder,
  validateCartItems,
  updateOrderPaymentMethod,
} from "@/components/checkout/actions";
import type { QPayInvoiceData } from "@/lib/qpay/types";
import type {
  OrderItemPayload,
  LendMNInvoiceData,
  StorePayInvoiceData,
} from "@/components/checkout/PaymentModal";
import { createClient } from "@/lib/supabase/client";
import type { DeliveryZone } from "@/types/database";

export default function CheckoutPage() {
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const selectedCoupon = useCartStore((s) => s.selectedCoupon);
  const selectedPoints = useCartStore((s) => s.selectedPoints);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qpay");
  const [invoiceData, setInvoiceData] = useState<QPayInvoiceData | null>(null);
  const [lendmnInvoiceData, setLendmnInvoiceData] =
    useState<LendMNInvoiceData | null>(null);
  const [storepayInvoiceData, setStorepayInvoiceData] =
    useState<StorePayInvoiceData | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [freeOrderSuccess, setFreeOrderSuccess] = useState(false);

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [cartWarning, setCartWarning] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setDeliveryZones(data);
      });
  }, []);

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

  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  // Fetch product→categories mapping for category scope coupon check.
  // Use a per-effect "cancelled" flag so a stale fetch can't overwrite the
  // map after the user adds/removes items rapidly. Without this guard, an
  // older in-flight request can resolve last and replace the correct map.
  const [productCategoryMap, setProductCategoryMap] = useState<
    Record<string, string[]>
  >({});
  useEffect(() => {
    const productIds = cartItems.map((ci) => ci.product.id);
    if (productIds.length === 0) {
      setProductCategoryMap({});
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    (supabase as any)
      .from("product_categories")
      .select("product_id, category_id")
      .in("product_id", productIds)
      .then(({ data }: { data: any[] | null }) => {
        if (cancelled || !data) return;
        const map: Record<string, string[]> = {};
        for (const row of data) {
          if (!map[row.product_id]) map[row.product_id] = [];
          map[row.product_id].push(row.category_id);
        }
        setProductCategoryMap(map);
      });
    return () => {
      cancelled = true;
    };
  }, [cartItems]);
  const items: CartItem[] = useMemo(
    () =>
      cartItems.map((ci) => {
        // Use variant data if available
        const price = ci.variant ? ci.variant.price : ci.product.price;
        const discountPrice = ci.variant
          ? ci.variant.discount_price
          : ci.product.discount_price;
        const hasDiscount = discountPrice != null && discountPrice < price;
        const sellingPrice = hasDiscount ? discountPrice : price;
        const image = ci.variant?.images?.[0] ?? ci.product.images?.[0];
        const displayName = ci.variant?.name
          ? `${ci.product.name} - ${ci.variant.name}`
          : ci.product.name;

        return {
          id: ci.id,
          name: displayName,
          originalPrice: price,
          salePrice: sellingPrice,
          quantity: ci.quantity,
          image,
          variantName: ci.variant?.name ?? null,
          sku: ci.variant?.sku ?? ci.product.sku ?? null,
        };
      }),
    [cartItems],
  );

  // Populate address fields from Supabase
  useEffect(() => {
    if (addressData) {
      setAddressName(addressData.name || "");
      setCity(addressData.city);
      setDistrict(addressData.district);
      setKhoroo(addressData.sub_district);
      setAddress(addressData.detail);
      setIsDefault(addressData.is_default);
    }
  }, [addressData]);

  // Populate contact fields from Supabase
  useEffect(() => {
    if (contactData) {
      setLastName(contactData.lastName);
      setFirstName(contactData.firstName);
      setPhone1(contactData.phone1);
      setPhone2(contactData.phone2);
    }
  }, [contactData]);

  const handleSelectAddress = (addr: Parameters<typeof selectAddress>[0]) => {
    selectAddress(addr);
    setAddressName(addr.name);
    setCity(addr.city);
    setDistrict(addr.district);
    setKhoroo(addr.sub_district);
    setAddress(addr.detail);
    setIsDefault(addr.is_default);
  };

  const handleAddNewAddress = () => {
    setAddressName("");
    setCity("");
    setDistrict("");
    setKhoroo("");
    setAddress("");
    setIsDefault(false);
    addNewAddress();
  };

  const handleSaveAddress = async () => {
    await saveAddress({
      name: addressName,
      city,
      district,
      sub_district: khoroo,
      detail: address,
      is_default: isDefault,
    });
  };

  const orderItemsPayload: OrderItemPayload[] = useMemo(
    () =>
      cartItems.map((ci) => {
        // Use variant data if available
        const price = ci.variant ? ci.variant.price : ci.product.price;
        const discountPrice = ci.variant
          ? ci.variant.discount_price
          : ci.product.discount_price;
        const hasDiscount = discountPrice != null && discountPrice < price;
        const sellingPrice = hasDiscount ? discountPrice : price;
        const displayName = ci.variant?.name
          ? `${ci.product.name} - ${ci.variant.name}`
          : ci.product.name;

        return {
          productId: ci.product.id,
          name: displayName,
          price: sellingPrice,
          quantity: ci.quantity,
          variantId: ci.variant?.id ?? null,
          variantName: ci.variant?.name ?? null,
        };
      }),
    [cartItems],
  );

  // Validate cart items on mount (check products still active)
  useEffect(() => {
    if (orderItemsPayload.length === 0) return;
    validateCartItems(orderItemsPayload).then((result) => {
      if (!result.valid) {
        setCartWarning(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePayment = async () => {
    if (isCreatingInvoice) return;

    const success = await syncToSupabase({
      lastName,
      firstName,
      phone1,
      phone2,
    });
    if (!success) return;

    // Free order path: skip payment gateway when total is 0
    if (totalPayable === 0) {
      setIsCreatingInvoice(true);
      setInvoiceError(null);

      const freeResult = await createFreeOrder({
        total: 0,
        couponDiscount,
        pointDiscount,
        couponId: selectedCoupon?.coupon_id ?? null,
        pointsUsed: pointDiscount,
        contact: { firstName, lastName },
        items: orderItemsPayload,
        address: { city, district, sub_district: khoroo, detail: address },
      });

      setIsCreatingInvoice(false);

      if (freeResult.success) {
        setFreeOrderSuccess(true);
        clearCart();
      } else {
        setInvoiceError(freeResult.error);
      }
      return;
    }

    // Reset invoice state and open modal
    setPaymentMethod("qpay");
    setInvoiceData(null);
    setLendmnInvoiceData(null);
    setStorepayInvoiceData(null);
    setInvoiceError(null);
    setOrderNumber(null);
    setOrderId(null);
    setIsCreatingInvoice(true);
    setShowPaymentModal(true);

    // Create QPay invoice
    const result = await createCheckoutInvoice({
      total: totalPayable,
      couponDiscount,
      pointDiscount,
      couponId: selectedCoupon?.coupon_id ?? null,
      pointsUsed: pointDiscount,
      contact: { firstName, lastName },
      items: orderItemsPayload,
      address: { city, district, sub_district: khoroo, detail: address },
    });

    setIsCreatingInvoice(false);

    if (result.success) {
      setInvoiceData(result.data.invoice);
      setOrderNumber(result.data.orderNumber);
      setOrderId(result.data.orderId);
    } else {
      setInvoiceError(result.error);
    }
  };

  const handleLendMNSelect = async () => {
    if (isCreatingInvoice) return;

    setPaymentMethod("lendmn");
    setLendmnInvoiceData(null);
    setInvoiceError(null);
    setIsCreatingInvoice(true);

    const result = await createLendMNCheckoutInvoice({
      total: totalPayable,
      couponDiscount,
      pointDiscount,
      couponId: selectedCoupon?.coupon_id ?? null,
      pointsUsed: pointDiscount,
      contact: { firstName, lastName },
      phoneNumber: phone1,
      items: orderItemsPayload,
      address: { city, district, sub_district: khoroo, detail: address },
    });

    setIsCreatingInvoice(false);

    if (result.success) {
      setLendmnInvoiceData({
        invoiceId: result.data.invoiceId,
        invoiceNumber: result.data.invoiceNumber,
      });
      setOrderNumber(result.data.orderNumber);
      setOrderId(result.data.orderId);
    } else {
      setInvoiceError(result.error);
    }
  };

  const handleStorePaySelect = async () => {
    if (isCreatingInvoice) return;

    setPaymentMethod("storepay");
    setStorepayInvoiceData(null);
    setInvoiceError(null);
    setIsCreatingInvoice(true);

    const result = await createStorePayCheckoutInvoice({
      total: totalPayable,
      couponDiscount,
      couponId: selectedCoupon?.coupon_id ?? null,
      contact: { firstName, lastName },
      phoneNumber: phone1,
      items: orderItemsPayload,
      address: { city, district, sub_district: khoroo, detail: address },
    });

    setIsCreatingInvoice(false);

    if (result.success) {
      setStorepayInvoiceData({
        invoiceId: result.data.invoiceId,
        loanId: result.data.loanId,
      });
      setOrderNumber(result.data.orderNumber);
      setOrderId(result.data.orderId);
    } else {
      setInvoiceError(result.error);
    }
  };

  const handleTransferSelect = async () => {
    if (!orderId) return;
    setPaymentMethod("transfer");
    await updateOrderPaymentMethod(orderId, "transfer");
  };

  const handleQPayReselect = async () => {
    if (!orderId) return;
    setPaymentMethod("qpay");
    await updateOrderPaymentMethod(orderId, "qpay");
  };

  const handlePaymentSuccess = useCallback(() => {
    clearCart();
  }, [clearCart]);

  // Address is valid if saved OR if all required fields are filled
  const addressValid =
    addressSaved ||
    (city !== "" && district !== "" && khoroo !== "" && address.trim() !== "");

  const canPay =
    items.length > 0 &&
    !cartWarning &&
    !isCreatingInvoice &&
    addressValid &&
    deliveryZones.length > 0 &&
    lastName.trim() !== "" &&
    firstName.trim() !== "" &&
    phone1.trim() !== "";

  const subtotal = items.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0,
  );
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.salePrice) * item.quantity,
    0,
  );
  const afterProductDiscount = subtotal - totalDiscount;
  const activeZone =
    city === "Улаанбаатар"
      ? deliveryZones.find((z) => z.name === "Улаанбаатар")
      : city
        ? deliveryZones.find((z) => z.name === "Орон нутаг")
        : null;
  const deliveryFee =
    activeZone &&
    activeZone.is_free_delivery_enabled &&
    activeZone.free_delivery_threshold != null &&
    afterProductDiscount >= activeZone.free_delivery_threshold
      ? 0
      : (activeZone?.delivery_fee ?? 0);
  // Coupon discount calculation (scope-aware)
  let couponDiscount = 0;
  if (selectedCoupon) {
    // Calculate the base amount the coupon applies to
    let applicableSubtotal: number;
    const applicableUnits: number[] = [];

    if (!selectedCoupon.scope || selectedCoupon.scope === "all") {
      applicableSubtotal = afterProductDiscount;
    } else {
      const scopeIds = new Set(selectedCoupon.scope_item_ids ?? []);
      const matchingUnits: number[] = [];

      for (const ci of cartItems) {
        const price = ci.variant
          ? ci.variant.discount_price != null &&
            ci.variant.discount_price < ci.variant.price
            ? ci.variant.discount_price
            : ci.variant.price
          : ci.product.discount_price != null &&
              ci.product.discount_price < ci.product.price
            ? ci.product.discount_price
            : ci.product.price;

        let matches = false;
        if (selectedCoupon.scope === "product") {
          matches = scopeIds.has(ci.product.id);
        } else if (selectedCoupon.scope === "category") {
          const cats = productCategoryMap[ci.product.id] ?? [];
          matches = cats.some((catId) => scopeIds.has(catId));
        } else if (selectedCoupon.scope === "brand") {
          matches = ci.product.brand_id
            ? scopeIds.has(ci.product.brand_id)
            : false;
        }

        if (matches) {
          for (let i = 0; i < ci.quantity; i++) {
            matchingUnits.push(price);
          }
        }
      }

      matchingUnits.sort((a, b) => b - a);
      const limit = selectedCoupon.max_applicable_qty ?? matchingUnits.length;
      const limited = matchingUnits.slice(0, limit);
      applicableSubtotal = limited.reduce((sum, p) => sum + p, 0);
      applicableUnits.push(...limited);
    }

    if (selectedCoupon.type === "percentage") {
      let discount = Math.round(
        applicableSubtotal * (selectedCoupon.discount_value / 100),
      );
      if (selectedCoupon.max_discount_amount) {
        discount = Math.min(discount, selectedCoupon.max_discount_amount);
      }
      couponDiscount = Math.min(discount, applicableSubtotal);
    } else if (selectedCoupon.type === "fixed") {
      if (applicableUnits.length > 0) {
        couponDiscount = applicableUnits.reduce(
          (sum, unitPrice) =>
            sum + Math.min(selectedCoupon.discount_value, unitPrice),
          0,
        );
      } else {
        couponDiscount = Math.min(
          selectedCoupon.discount_value,
          applicableSubtotal,
        );
      }
    } else if (selectedCoupon.type === "free_shipping") {
      couponDiscount = Math.min(selectedCoupon.discount_value, deliveryFee);
    }
  }
  // Point discount calculation
  const totalAfterCoupon = afterProductDiscount + deliveryFee - couponDiscount;
  const pointDiscount = selectedPoints
    ? Math.min(selectedPoints, totalAfterCoupon)
    : 0;
  const totalPayable = totalAfterCoupon - pointDiscount;

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col gap-0 md:gap-5 max-w-[1064px] w-full px-4 xl:px-0 pb-10">
        {/* Breadcrumb */}
        <div className="flex flex-col pt-6 md:pt-8 pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <Link
              href="/cart"
              className="text-[#64748B] font-normal text-sm font-manrope hover:text-[#020617] transition-colors duration-200"
            >
              Сагс
            </Link>
            <Slash />
            <span className="text-[#020617] font-normal text-sm font-manrope">
              Захиалга баталгаажуулах
            </span>
          </div>

          <p className="px-0.5 text-[#020617] font-bold text-xl md:text-[26px] leading-7 md:leading-9 font-manrope tracking-[-0.26px]">
            Захиалга баталгаажуулах
          </p>
        </div>

        {cartWarning && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-sm p-3 text-[#991B1B] text-sm font-manrope">
            {cartWarning}
          </div>
        )}

        {invoiceError && !showPaymentModal && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-sm p-3 text-[#991B1B] text-sm font-manrope">
            {invoiceError}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start">
          {/* Left: Forms */}
          <div className="w-full flex-1 flex flex-col gap-2 md:gap-8 pr-0 md:pr-16 lg:pr-32">
            <DeliveryAddressForm
              addressName={addressName}
              city={city}
              district={district}
              khoroo={khoroo}
              address={address}
              isDefault={isDefault}
              addressSaved={addressSaved}
              onAddressNameChange={setAddressName}
              onAddressChange={setAddress}
              onIsDefaultChange={setIsDefault}
              onOpenModal={setOpenModal}
              onSave={handleSaveAddress}
              onEdit={() => setShowAddressModal(true)}
            />

            <ContactForm
              lastName={lastName}
              firstName={firstName}
              phone1={phone1}
              phone2={phone2}
              addressSaved={addressSaved}
              onLastNameChange={setLastName}
              onFirstNameChange={setFirstName}
              onPhone1Change={setPhone1}
              onPhone2Change={setPhone2}
            />
          </div>

          {/* Right: Payment Summary */}
          <PaymentSummary
            items={items}
            canPay={canPay}
            syncing={syncing}
            loading={loading}
            deliveryFee={deliveryFee}
            deliveryFeeResolved={deliveryZones.length > 0 && city !== ""}
            onPayment={handlePayment}
            selectedCoupon={selectedCoupon}
            couponDiscount={couponDiscount}
            pointDiscount={pointDiscount}
            ubZone={deliveryZones.find((z) => z.name === "Улаанбаатар")}
            regionalZone={deliveryZones.find((z) => z.name === "Орон нутаг")}
          />
        </div>
      </div>

      {/* Address Selection Multi-Step Modal */}
      <AddressMultiStepModal
        isOpen={openModal !== null}
        onClose={() => setOpenModal(null)}
        initialStep={openModal}
        city={city}
        setCity={setCity}
        district={district}
        setDistrict={setDistrict}
        khoroo={khoroo}
        setKhoroo={setKhoroo}
      />

      {/* Address Select Modal */}
      <AddressSelectModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        addresses={allAddresses}
        selectedAddressId={addressId}
        onSelect={handleSelectAddress}
        onEdit={editExistingAddress}
        onAddNew={handleAddNewAddress}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={totalPayable}
        invoiceData={invoiceData}
        lendmnInvoiceData={lendmnInvoiceData}
        storepayInvoiceData={storepayInvoiceData}
        paymentMethod={paymentMethod}
        isCreating={isCreatingInvoice}
        createError={invoiceError}
        orderItems={orderItemsPayload}
        orderNumber={orderNumber}
        orderId={orderId}
        phoneNumber={phone1}
        couponId={selectedCoupon?.coupon_id ?? null}
        couponDiscount={couponDiscount}
        pointsUsed={pointDiscount}
        pointDiscount={pointDiscount}
        onPaymentSuccess={handlePaymentSuccess}
        onLendMNSelect={handleLendMNSelect}
        onStorePaySelect={handleStorePaySelect}
        onTransferSelect={handleTransferSelect}
        onQPayReselect={handleQPayReselect}
      />

      {/* Free Order Success Modal */}
      {freeOrderSuccess && (
        <div className="fixed inset-0 z-999 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(2,6,23,0.30)]"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-[375px] mx-4 bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center gap-8">
              <div className="w-[56px] h-[56px] bg-[#14B8A6] rounded-full flex items-center justify-center">
                <Success />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-[#020617] font-semibold text-xl font-manrope">
                  Захиалга баталгаажлаа
                </p>
                <p className="text-[#64748B] font-normal text-base font-manrope text-center">
                  Та захиалгаа профайл цэснээс хянах боломжтой
                </p>
              </div>
              <div className="flex gap-[10px] w-full">
                <Link
                  href="/profile"
                  prefetch={true}
                  className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm cursor-pointer text-[#020617] font-normal text-base font-manrope hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  Захиалгаа харах
                </Link>
                <Link
                  href="/products"
                  prefetch={true}
                  className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200"
                >
                  Дэлгүүр хэсэх
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
