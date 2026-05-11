"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Cancel,
  ChevronDownCart,
  Minus,
  MPointBadge,
  MPointSmall,
  Plus,
  ShoppingCart,
  Trash,
} from "@/components/svg";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { formatPrice } from "@/lib/utils/formatters";
import { ROUTES } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { ClearCartModal } from "@/components/cart/ClearCartModal";
import { CouponSelectModal } from "@/components/cart/CouponSelectModal";
import { PointSelectModal } from "@/components/cart/PointSelectModal";
import { VariantEditSheet } from "@/components/cart/VariantEditSheet";
import type { CouponData } from "@/components/profile/CouponCard";
import type { DeliveryZone } from "@/types/database";
import { ChevronDown } from "lucide-react";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const isHydrated = useCartStore((s) => s.isHydrated);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const openLogin = useUIStore((s) => s.openLogin);
  const router = useRouter();

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{
    cartItemId: string;
    productSlug: string;
    currentVariantId: string;
  } | null>(null);
  const selectedCoupon = useCartStore((s) => s.selectedCoupon);
  const setSelectedCoupon = useCartStore((s) => s.setSelectedCoupon);
  const selectedPoints = useCartStore((s) => s.selectedPoints);
  const setSelectedPoints = useCartStore((s) => s.setSelectedPoints);
  const [pointBalance, setPointBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchPointBalance = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const db = supabase as any;
      const { data } = await db
        .from("point_transactions")
        .select("amount")
        .eq("user_id", user.id);
      const total = (data ?? []).reduce(
        (sum: number, t: { amount: number }) => sum + t.amount,
        0,
      );
      setPointBalance(total);
    };
    fetchPointBalance();
  }, []);

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

  // Remove inactive/deleted products from cart on mount
  useEffect(() => {
    if (!isHydrated || items.length === 0) return;
    const productIds = [...new Set(items.map((i) => i.product.id))];
    const supabase = createClient();
    supabase
      .from("products")
      .select("id")
      .in("id", productIds)
      .eq("is_active", true)
      .then(({ data }) => {
        const activeIds = new Set((data ?? []).map((p) => p.id));
        const inactiveItems = items.filter((i) => !activeIds.has(i.product.id));
        for (const item of inactiveItems) {
          removeItem(item.id);
        }
      });
  }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch product→categories mapping for category scope coupon check
  const [productCategoryMap, setProductCategoryMap] = useState<
    Record<string, string[]>
  >({});
  useEffect(() => {
    const productIds = items.map((i) => i.product.id);
    if (productIds.length === 0) return;
    const supabase = createClient();
    (supabase as any)
      .from("product_categories")
      .select("product_id, category_id")
      .in("product_id", productIds)
      .then(({ data }: { data: any[] | null }) => {
        if (!data) return;
        const map: Record<string, string[]> = {};
        for (const row of data) {
          if (!map[row.product_id]) map[row.product_id] = [];
          map[row.product_id].push(row.category_id);
        }
        setProductCategoryMap(map);
      });
  }, [items]);

  const handleCheckout = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/checkout");
        return;
      }
    } catch {}
    openLogin("/checkout");
  };

  if (!isHydrated) {
    return (
      <div className="w-full bg-white flex justify-center min-h-screen">
        <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
          <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
            Сагс
          </p>
          <div className="space-y-4 pt-8">
            <div className="h-6 w-32 skeleton" />
            <div className="h-24 skeleton" />
            <div className="h-24 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full bg-white flex justify-center">
        <div className="flex flex-col items-center max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
          <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope w-full hidden md:block">
            Сагс
          </p>

          <div className="pt-[152px] md:pt-7 flex flex-col gap-8 md:gap-[88px] w-full">
            <div className="flex-col gap-4 hidden md:flex">
              <div className="flex items-center gap-1">
                <p className="text-[#020617] font-black text-base font-manrope">
                  {items.length}
                </p>
                <p className="text-[#020617] font-medium text-base font-manrope">
                  Бүтээгдэхүүн
                </p>
              </div>
              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="py-2">
                  <ShoppingCart />
                </div>
                <p className="text-[#64748B] font-normal text-base font-manrope">
                  Одоогоор бүтээгдэхүүн сагслаагүй байна
                </p>
              </div>

              <Link
                href="/products"
                className="px-3 max-w-[154px] w-full h-10 py-1 flex items-center justify-center rounded-sm border border-[#E2E8F0] text-[#020617] font-normal text-sm font-manrope transition-colors duration-200 hover:bg-surface"
              >
                Дэлгүүр хэсэх
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.variant ? item.variant.price : item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const totalDiscount = items.reduce((sum, item) => {
    const price = item.variant ? item.variant.price : item.product.price;
    const discountPrice = item.variant
      ? item.variant.discount_price
      : item.product.discount_price;
    if (discountPrice == null || discountPrice >= price) return sum;
    return sum + (price - discountPrice) * item.quantity;
  }, 0);
  const ubZone = deliveryZones.find((z) => z.name === "Улаанбаатар") ?? null;
  const cartSubtotal = subtotal - totalDiscount;
  const deliveryFee =
    ubZone &&
    ubZone.is_free_delivery_enabled &&
    ubZone.free_delivery_threshold != null &&
    cartSubtotal >= ubZone.free_delivery_threshold
      ? 0
      : (ubZone?.delivery_fee ?? 0);
  // Coupon discount calculation (scope-aware)
  let couponDiscount = 0;
  if (selectedCoupon) {
    let applicableSubtotal: number;
    const applicableUnits: number[] = [];

    if (!selectedCoupon.scope || selectedCoupon.scope === "all") {
      applicableSubtotal = cartSubtotal;
    } else {
      const scopeIds = new Set(selectedCoupon.scope_item_ids ?? []);
      const matchingUnits: number[] = [];

      for (const ci of items) {
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
        // Per-unit: each unit gets up to discount_value off
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
  const totalAfterCoupon = cartSubtotal + deliveryFee - couponDiscount;
  const pointDiscount = selectedPoints
    ? Math.min(selectedPoints, totalAfterCoupon)
    : 0;
  const totalPayable = totalAfterCoupon - pointDiscount;

  // Mobile Layout
  const MobileLayout = () => (
    <div className="w-full bg-white flex flex-col pb-20">
      <div className="flex flex-col">
        {/* Title */}
        <p className="pb-2 pt-5 text-[#020617] font-bold text-2xl font-manrope  px-4">
          Сагс
        </p>

        {/* Payment Summary */}
        <div className="flex flex-col gap-3 py-4  px-4">
          <p className="text-[#020617] font-bold text-base font-manrope">
            Төлбөрийн мэдээлэл
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[#64748B] font-normal text-sm font-manrope">
                Үнийн дүн ({totalCount}ш)
              </p>
              <p className="text-[#020617] font-medium text-sm font-manrope">
                {formatPrice(subtotal)}
              </p>
            </div>

            {totalDiscount > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-[#64748B] font-normal text-sm font-manrope">
                  Нийт хэмнэсэн
                </p>
                <p className="text-[#F43F5E] font-medium text-sm font-manrope">
                  -{formatPrice(totalDiscount)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-[#64748B] font-normal text-base font-manrope">
                  Monpang point
                </p>
                {selectedPoints ? (
                  <button
                    onClick={() => setSelectedPoints(null)}
                    className="flex items-center gap-1 pl-3 h-6 pr-2 border border-[#E2E8F0] rounded-full cursor-pointer"
                  >
                    <span className="text-[#020617] font-medium text-xs font-manrope">
                      Болих
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M10.5 3.5L3.50047 10.4995M10.4995 10.5L3.5 3.50049"
                        stroke="#94A3B8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPointModal(true)}
                    className="flex items-center gap-1 pl-3 h-6 pr-2 border border-[#E2E8F0] rounded-full cursor-pointer"
                  >
                    <span className="text-[#020617] font-medium text-xs font-manrope flex items-center gap-0.5">
                      {pointBalance !== null && pointBalance > 0 ? (
                        <>
                          Ашиглах - {pointBalance.toLocaleString()}{" "}
                          <span className="pb-[1.4px]">
                            <MPointSmall />
                          </span>
                        </>
                      ) : (
                        "Сонгох"
                      )}
                    </span>
                    <ChevronDown size={12} color="#94A3B8" />
                  </button>
                )}
              </div>
              {pointDiscount > 0 ? (
                <div className="flex items-center text-[#F43F5E] font-medium text-base font-manrope">
                  -{pointDiscount.toLocaleString()}{" "}
                  <MPointBadge className="ml-[2px]" />
                </div>
              ) : (
                <p className="text-[#0F172A] font-medium text-base font-manrope text-right">
                  --
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-[#64748B] font-normal text-base font-manrope">
                  Миний купон
                </p>
                <button
                  onClick={() => setShowCouponModal(true)}
                  className="flex items-center gap-1 pl-3 h-6 pr-2 border border-[#E2E8F0] rounded-full cursor-pointer"
                >
                  <span className="text-[#020617] font-medium text-xs font-manrope">
                    {selectedCoupon
                      ? `${selectedCoupon.code} - ${selectedCoupon.type === "percentage" ? `${selectedCoupon.discount_value}%` : formatPrice(selectedCoupon.discount_value)}`
                      : "Сонгох"}
                  </span>
                  <ChevronDown size={12} color="#94A3B8" />
                </button>
              </div>
              {couponDiscount > 0 ? (
                <p className="text-[#F43F5E] font-medium text-base font-manrope">
                  -{formatPrice(couponDiscount)}
                </p>
              ) : (
                <p className="text-[#0F172A] font-medium text-base font-manrope text-right">
                  --
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[#64748B] font-normal text-sm font-manrope">
                Хүргэлт
              </p>
              <p
                className={`font-medium text-sm font-manrope ${deliveryFee === 0 ? "text-teal-600" : "text-[#020617]"}`}
              >
                {deliveryFee === 0 ? "Үнэгүй" : formatPrice(deliveryFee)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[#020617] font-bold text-base font-manrope">
              Нийт төлөх дүн
            </p>
            <p className="text-[#020617] font-bold text-base font-manrope">
              {formatPrice(totalPayable)}
            </p>
          </div>
        </div>

        <div className="py-2">
          <div className="w-full h-px bg-[#E2E8F0]" />
        </div>

        {/* Products Header */}
        <div className="flex items-center justify-between py-1  px-4">
          <div className="flex items-center gap-1">
            <p className="text-[#020617] font-black text-base font-manrope">
              {items.length}
            </p>
            <p className="text-[#020617] font-medium text-base font-manrope">
              Бүтээгдэхүүн
            </p>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="text-[#64748B] font-medium text-sm font-manrope underline underline-offset-2 cursor-pointer"
          >
            Сагс цэвэрлэх
          </button>
        </div>

        {/* Products List */}
        <div className="flex flex-col gap-4 pt-3 pb-5 px-4">
          {items.map((item) => {
            const price = item.variant
              ? item.variant.price
              : item.product.price;
            const discountPrice = item.variant
              ? item.variant.discount_price
              : item.product.discount_price;
            const hasDiscount = discountPrice != null && discountPrice < price;
            const discount = hasDiscount
              ? Math.round(((price - discountPrice!) / price) * 100)
              : null;
            const sellingPrice = hasDiscount ? discountPrice! : price;
            const image = item.variant?.images?.[0] ?? item.product.images?.[0];
            const stockQuantity = item.variant
              ? item.variant.stock_quantity
              : item.product.stock_quantity;
            const variantLabel =
              item.variant?.option_values?.join(" / ") || item.variant?.name;

            return (
              <div key={item.id} className="flex gap-4 items-start">
                <Link
                  href={ROUTES.PRODUCT(item.product.slug)}
                  className="w-[72px] h-[72px] rounded-sm shrink-0 overflow-hidden block"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={item.product.name}
                      width={72}
                      height={72}
                      quality={75}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F1F5F9]" />
                  )}
                </Link>

                <div className="flex gap-4 items-start flex-1 min-w-0">
                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    {/* Name + variant */}
                    <div className="flex flex-col gap-2">
                      <Link
                        href={ROUTES.PRODUCT(item.product.slug)}
                        className="text-[#020617] font-normal text-xs font-manrope leading-5 line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      {variantLabel && item.variant && (
                        <button
                          onClick={() =>
                            setEditingVariant({
                              cartItemId: item.id,
                              productSlug: item.product.slug,
                              currentVariantId: item.variant!.id,
                            })
                          }
                          className="inline-flex w-full items-center justify-between gap-0.5 px-1 py-1.5 bg-[#F8FAFC] rounded-sm cursor-pointer self-start"
                        >
                          <span className="text-[#64748B] font-normal text-xs font-manrope line-clamp-1 text-left">
                            {variantLabel}
                          </span>
                          <div className="shrink-0">
                            <ChevronDownCart />
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Quantity */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
                            item.quantity > 1
                              ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                              : "border-[#E2E8F0]"
                          }`}
                        >
                          <Minus
                            color={item.quantity > 1 ? "#020617" : "#CBD5E1"}
                          />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-[#020617] font-semibold text-sm font-manrope">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.min(item.quantity + 1, stockQuantity),
                            )
                          }
                          disabled={item.quantity >= stockQuantity}
                          className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
                            item.quantity < stockQuantity
                              ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                              : "border-[#E2E8F0]"
                          }`}
                        >
                          <Plus
                            color={
                              item.quantity < stockQuantity
                                ? "#020617"
                                : "#CBD5E1"
                            }
                          />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col">
                        {hasDiscount && (
                          <p className="text-[#64748B] font-normal text-xs font-manrope line-through">
                            {formatPrice(price)}
                          </p>
                        )}
                        <div className="flex items-center gap-1">
                          {discount && (
                            <p className="text-[#F43F5E] font-semibold text-xs font-manrope">
                              {discount}%
                            </p>
                          )}
                          <p className="text-[#020617] font-semibold text-xs font-manrope whitespace-nowrap">
                            {formatPrice(sellingPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 shrink-0 cursor-pointer"
                    aria-label="Remove"
                  >
                    <Cancel />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F1F5F9] px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handleCheckout}
          className="w-full py-3.5 px-3 bg-[#020617] rounded-sm text-white font-normal text-lg font-manrope cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 text-center"
        >
          Үргэлжлүүлэх
        </button>
      </div>
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        {/* Title */}
        <p className="px-0.5 pb-2 pt-[52px] text-[#020617] font-bold text-[26px] leading-9 font-manrope">
          Сагс
        </p>

        <div className="flex flex-row gap-4 items-start">
          <div className="pr-16 pt-1.5 flex flex-col w-full">
            <div className="flex items-center justify-between pb-5">
              <div className="flex items-center gap-1">
                <p className="text-[#020617] font-black text-base font-manrope">
                  {items.length}
                </p>
                <p className="text-[#020617] font-medium text-base font-manrope">
                  Бүтээгдэхүүн
                </p>
              </div>
              <button
                onClick={() => setShowClearModal(true)}
                className="text-[#64748B] font-medium text-sm font-manrope underline underline-offset-2 cursor-pointer hover:text-[#020617] transition-colors duration-200 whitespace-nowrap"
              >
                Сагс цэвэрлэх
              </button>
            </div>

            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            <div className="flex flex-col gap-4 pt-4">
              {items.map((item, index) => {
                const price = item.variant
                  ? item.variant.price
                  : item.product.price;
                const discountPrice = item.variant
                  ? item.variant.discount_price
                  : item.product.discount_price;
                const hasDiscount =
                  discountPrice != null && discountPrice < price;
                const discount = hasDiscount
                  ? Math.round(((price - discountPrice!) / price) * 100)
                  : null;
                const sellingPrice = hasDiscount ? discountPrice! : price;
                const image =
                  item.variant?.images?.[0] ?? item.product.images?.[0];
                const stockQuantity =
                  item.variant?.stock_quantity ?? item.product.stock_quantity;
                const variantInfo =
                  item.variant?.option_values?.join(", ") || item.variant?.name;
                const displayName = item.product.name;

                return (
                  <div key={item.id}>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex gap-5 items-center">
                        <Link
                          href={ROUTES.PRODUCT(item.product.slug)}
                          className="w-[104px] h-[104px] rounded-sm border border-[#F1F5F9] bg-[#F1F5F9] shrink-0 overflow-hidden block"
                        >
                          {image && (
                            <Image
                              src={image}
                              alt={item.product.name}
                              width={104}
                              height={104}
                              quality={75}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </Link>

                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col max-w-[380px]">
                              <Link
                                href={ROUTES.PRODUCT(item.product.slug)}
                                className="text-[#020617] font-medium text-base font-manrope leading-6 hover:underline"
                              >
                                {displayName}
                              </Link>
                              {variantInfo && (
                                <p className="text-[#64748B] font-normal text-sm font-manrope">
                                  {variantInfo}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-0.5 items-end shrink-0">
                              {hasDiscount && (
                                <p className="text-[#64748B] font-normal text-xs font-manrope line-through">
                                  {formatPrice(price)}
                                </p>
                              )}
                              <div className="flex items-center gap-1">
                                {discount && (
                                  <p className="text-[#F43F5E] font-semibold text-sm font-manrope">
                                    {discount}%
                                  </p>
                                )}
                                <p className="text-[#020617] font-semibold text-sm font-manrope">
                                  {formatPrice(sellingPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className={`p-[5px] rounded-sm transition-colors duration-200 ${
                              item.quantity > 1
                                ? "cursor-pointer bg-[#F1F5F9] hover:bg-[#E2E8F0]"
                                : "bg-[#F8FAFC]"
                            }`}
                          >
                            <Minus
                              color={item.quantity > 1 ? "#020617" : "#CBD5E1"}
                            />
                          </button>
                          <div className="w-11 flex items-center justify-center">
                            <p className="text-[#020617] font-medium text-base font-manrope">
                              {item.quantity}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.min(item.quantity + 1, stockQuantity),
                              )
                            }
                            disabled={item.quantity >= stockQuantity}
                            className={`p-[5px] rounded-sm transition-colors duration-200 ${
                              item.quantity < stockQuantity
                                ? "cursor-pointer bg-[#F1F5F9] hover:bg-[#E2E8F0]"
                                : "bg-[#F8FAFC]"
                            }`}
                          >
                            <Plus
                              color={
                                item.quantity < stockQuantity
                                  ? "#020617"
                                  : "#CBD5E1"
                              }
                            />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-[5px] cursor-pointer hover:opacity-70 transition-opacity duration-200"
                        >
                          <Trash />
                        </button>
                      </div>
                    </div>
                    {index < items.length - 1 && (
                      <div className="py-2 mt-4">
                        <div className="w-full h-px bg-[#E2E8F0]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Payment Summary */}
          <div className="w-[342px] shrink-0 flex flex-col gap-6">
            <div className="flex flex-col gap-8">
              <p className="text-[#020617] font-medium text-xl font-manrope">
                Төлбөрийн мэдээлэл
              </p>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[#64748B] font-normal text-base font-manrope">
                      Үнийн дүн ({totalCount}ш)
                    </p>
                    <p className="text-[#020617] font-medium text-base font-manrope">
                      {formatPrice(subtotal)}
                    </p>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-[#64748B] font-normal text-base font-manrope">
                        Хэмнэсэн
                      </p>
                      <p className="text-[#F43F5E] font-medium text-base font-manrope">
                        -{formatPrice(totalDiscount)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[#64748B] font-normal text-base font-manrope">
                        Monpang point
                      </p>
                      {selectedPoints ? (
                        <button
                          onClick={() => setSelectedPoints(null)}
                          className="flex items-center gap-1 pl-3 h-6 pr-2 border border-[#E2E8F0] rounded-full cursor-pointer"
                        >
                          <span className="text-[#020617] font-medium text-xs font-manrope">
                            Болих
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M10.5 3.5L3.50047 10.4995M10.4995 10.5L3.5 3.50049"
                              stroke="#94A3B8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowPointModal(true)}
                          className="flex items-center gap-1 pl-3 h-6 pr-2 border border-[#E2E8F0] rounded-full cursor-pointer"
                        >
                          <span className="text-[#020617] font-medium text-xs font-manrope flex items-center gap-0.5">
                            {pointBalance !== null && pointBalance > 0 ? (
                              <>
                                Ашиглах - {pointBalance.toLocaleString()}{" "}
                                <span className="pb-[1.4px]">
                                  <MPointSmall />
                                </span>
                              </>
                            ) : (
                              "Сонгох"
                            )}
                          </span>
                          <ChevronDown size={12} color="#94A3B8" />
                        </button>
                      )}
                    </div>
                    {pointDiscount > 0 ? (
                      <div className="flex items-center text-[#F43F5E] font-medium text-base font-manrope">
                        -{pointDiscount.toLocaleString()}{" "}
                        <MPointBadge className="ml-[2px]" />
                      </div>
                    ) : (
                      <p className="text-[#0F172A] font-medium text-base font-manrope text-right">
                        --
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[#64748B] font-normal text-base font-manrope">
                        Миний купон
                      </p>
                      <button
                        onClick={() => setShowCouponModal(true)}
                        className="flex items-center gap-1 pl-3 h-6 pr-2 border border-[#E2E8F0] rounded-full cursor-pointer"
                      >
                        <span className="text-[#020617] font-medium text-xs font-manrope">
                          {selectedCoupon
                            ? `${selectedCoupon.code} - ${selectedCoupon.type === "percentage" ? `${selectedCoupon.discount_value}%` : formatPrice(selectedCoupon.discount_value)}`
                            : "Сонгох"}
                        </span>
                        <ChevronDown size={12} color="#94A3B8" />
                      </button>
                    </div>
                    {couponDiscount > 0 ? (
                      <p className="text-[#F43F5E] font-medium text-base font-manrope">
                        -{formatPrice(couponDiscount)}
                      </p>
                    ) : (
                      <p className="text-[#0F172A] font-medium text-base font-manrope text-right">
                        --
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[#64748B] font-normal text-base font-manrope">
                      Хүргэлт
                    </p>
                    <p
                      className={`font-medium text-base font-manrope ${deliveryFee === 0 ? "text-teal-600" : "text-[#020617]"}`}
                    >
                      {deliveryFee === 0 ? "Үнэгүй" : formatPrice(deliveryFee)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-[#020617] font-semibold text-lg font-manrope">
                  Нийт төлөх дүн
                </p>
                <p className="text-[#020617] font-semibold text-lg font-manrope">
                  {formatPrice(totalPayable)}
                </p>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="w-full py-2.5 px-3 bg-[#020617] rounded-sm text-white font-normal text-base font-manrope cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 text-center"
            >
              Үргэлжлүүлэх
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <MobileLayout />
      </div>
      <div className="hidden md:block">
        <DesktopLayout />
      </div>
      <ClearCartModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => {
          clearCart();
          setShowClearModal(false);
        }}
      />
      <CouponSelectModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        selectedCouponId={selectedCoupon?.coupon_id ?? null}
        onSelect={(coupon: CouponData | null) => {
          if (coupon) {
            setSelectedCoupon({
              coupon_id: coupon.coupon_id,
              code: coupon.code,
              type: coupon.type,
              discount_value: coupon.discount_value,
              max_discount_amount: coupon.max_discount_amount,
              scope: coupon.scope || "all",
              scope_item_ids: coupon.scope_item_ids || [],
              max_applicable_qty: coupon.max_applicable_qty ?? null,
            });
          } else {
            setSelectedCoupon(null);
          }
        }}
      />
      <PointSelectModal
        isOpen={showPointModal}
        onClose={() => setShowPointModal(false)}
        onSelect={setSelectedPoints}
      />
      <VariantEditSheet
        isOpen={!!editingVariant}
        onClose={() => setEditingVariant(null)}
        productSlug={editingVariant?.productSlug ?? ""}
        currentVariantId={editingVariant?.currentVariantId ?? ""}
        cartItemId={editingVariant?.cartItemId ?? ""}
      />
    </>
  );
}
