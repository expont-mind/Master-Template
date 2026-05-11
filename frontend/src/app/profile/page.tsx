"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ProfileSidebar,
  type SideMenu,
} from "@/components/profile/ProfileSidebar";
import { OrdersContent } from "@/components/profile/OrdersContent";
import { ConnectionsContent } from "@/components/profile/ConnectionsContent";
import { AddressContent } from "@/components/profile/AddressContent";
import { AddressEditContent } from "@/components/profile/AddressEditContent";
import { PhoneContent } from "@/components/profile/PhoneContent";
import { PersonalContent } from "@/components/profile/PersonalContent";
import { CouponContent } from "@/components/profile/CouponContent";
import { PointContent } from "@/components/profile/PointContent";
import { SettingsContent } from "@/components/profile/SettingsContent";
import { HelpContent } from "@/components/profile/HelpContent";
import { BranchesContent } from "@/components/profile/BranchesContent";
import { FAQContent } from "@/components/profile/FAQContent";
import { PointActivation } from "@/components/profile/PointActivation";
import { PointActivationSuccessModal } from "@/components/profile/PointActivationSuccessModal";
import { PhoneVerificationModal } from "@/components/profile/PhoneVerificationModal";
import { LogoutModal } from "@/components/profile/LogoutModal";
import { activatePoints } from "@/components/profile/actions";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { useWishlistStore } from "@/stores/wishlist-store";
import { OrderCard } from "@/components/profile/OrderCard";
import {
  Box,
  TruckGray,
  BoxCancel,
  ChevronRight16Gray,
} from "@/components/svg";
import Image from "next/image";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export interface ProfileOrder {
  id: string;
  order_number: string | null;
  status: string;
  delivery_status: string | null;
  total_amount: number;
  points_used: number;
  payment_status: string;
  payment_wallet: string | null;
  created_at: string;
  updated_at: string;
  coupon_discount: number;
  coupon_code: string | null;
  items: {
    id: string;
    product_id: string;
    price: number;
    quantity: number;
    variant_name: string | null;
    products: {
      name: string;
      slug: string;
      images: string[];
      price: number;
      discount_price: number | null;
    } | null;
  }[];
}

type View =
  | { type: "orders" }
  | { type: "address" }
  | { type: "phone" }
  | { type: "point" }
  | { type: "wishlist" }
  | { type: "coupon" }
  | { type: "personal" }
  | { type: "connections" }
  | { type: "settings" }
  | { type: "help" }
  | { type: "branches" }
  | { type: "faq" }
  | { type: "address-edit"; addressId?: string };

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const actionParam = searchParams.get("action");
  const idParam = searchParams.get("id");
  const orderIdParam = searchParams.get("orderId");

  const [view, setView] = useState<View>({ type: "orders" });
  const [userData, setUserData] = useState<UserRow | null>(null);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const wishlistItems = useWishlistStore((s) => s.items);
  const [couponCount, setCouponCount] = useState(0);
  const [pointBalance, setPointBalance] = useState(0);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [mobileOrderTab, setMobileOrderTab] = useState(0);

  // Update view when URL params change
  useEffect(() => {
    if (tabParam === "address" && actionParam === "new") {
      setView({ type: "address-edit" });
    } else if (tabParam === "address" && actionParam === "edit" && idParam) {
      setView({ type: "address-edit", addressId: idParam });
    } else if (tabParam === "address") {
      setView({ type: "address" });
    } else if (tabParam === "phone") {
      setView({ type: "phone" });
    } else if (tabParam === "point") {
      setView({ type: "point" });
    } else if (tabParam === "personal") {
      setView({ type: "personal" });
    } else if (tabParam === "connections") {
      setView({ type: "connections" });
    } else if (tabParam === "coupon") {
      setView({ type: "coupon" });
    } else if (tabParam === "settings") {
      setView({ type: "settings" });
    } else if (tabParam === "help") {
      setView({ type: "help" });
    } else if (tabParam === "branches") {
      setView({ type: "branches" });
    } else if (tabParam === "faq") {
      setView({ type: "faq" });
    } else if (tabParam === "wishlist") {
      router.push("/wishlist");
    } else if (tabParam) {
      setView({ type: "orders" });
    } else {
      setView({ type: "orders" });
    }
  }, [tabParam, actionParam, idParam, router]);

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    const fetchAll = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      userId = user.id;

      const [userRes, ordersRes, addressRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("orders")
          .select(
            "id, order_number, status, delivery_status, total_amount, points_used, payment_status, created_at, updated_at, order_items(id, product_id, price, quantity, variant_name, products(name, slug, price, discount_price))",
          )
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false }),
      ]);

      if (userRes.data) setUserData(userRes.data);
      if (ordersRes.data) {
        // The orders→order_items join isn't declared in the hand-rolled
        // Database type's Relationships array, so PostgREST embed type
        // inference fails. The runtime shape is well-defined; narrow it
        // explicitly here.
        type EmbeddedOrderItem = {
          id: string;
          product_id: string;
          price: number;
          quantity: number;
          variant_name: string | null;
          products: {
            name: string;
            slug: string;
            price: number;
            discount_price: number | null;
          } | null;
        };
        type OrderRowEmbed = {
          id: string;
          order_number: string;
          status: string;
          delivery_status: string | null;
          total_amount: number;
          points_used: number | null;
          payment_status: string;
          created_at: string;
          updated_at: string;
          order_items: EmbeddedOrderItem[] | null;
        };
        const ordersData = ordersRes.data as unknown as OrderRowEmbed[];

        // Get all unique product IDs from order items
        const productIds = [
          ...new Set(
            ordersData.flatMap((o) =>
              (o.order_items ?? []).map((item) => item.product_id),
            ),
          ),
        ].filter(Boolean) as string[];

        // Fetch product images
        const productImagesMap = new Map<string, string[]>();
        if (productIds.length > 0) {
          const { data: productImages } = await supabase
            .from("product_images")
            .select("product_id, url, sort_order")
            .in("product_id", productIds)
            .is("variant_id", null)
            .order("sort_order", { ascending: true });
          for (const img of productImages ?? []) {
            const existing = productImagesMap.get(img.product_id) || [];
            existing.push(img.url);
            productImagesMap.set(img.product_id, existing);
          }
        }

        // Fetch payment wallet info and coupon usage (separate queries, no FK needed)
        const orderIds = ordersData
          .map((o) => o.id)
          .filter(Boolean) as string[];
        const paymentWalletMap = new Map<string, string>();
        const couponUsageMap = new Map<
          string,
          { discount_amount: number; code: string }
        >();
        if (orderIds.length > 0) {
          const [invoicesRes, couponUsagesRes] = await Promise.all([
            supabase
              .from("payment_invoices")
              .select("order_id, payment_wallet")
              .in("order_id", orderIds)
              .not("payment_wallet", "is", null),
            supabase
              .from("coupon_usages")
              .select("order_id, discount_amount, coupon_id, coupons(code)")
              .in("order_id", orderIds)
              .returns<
                {
                  order_id: string | null;
                  discount_amount: number;
                  coupon_id: string;
                  coupons: { code: string } | null;
                }[]
              >(),
          ]);
          for (const inv of invoicesRes.data ?? []) {
            if (inv.order_id && inv.payment_wallet) {
              paymentWalletMap.set(inv.order_id, inv.payment_wallet);
            }
          }
          for (const cu of couponUsagesRes.data ?? []) {
            if (cu.order_id) {
              couponUsageMap.set(cu.order_id, {
                discount_amount: Number(cu.discount_amount ?? 0),
                code: cu.coupons?.code ?? "",
              });
            }
          }
        }

        const mappedOrders = ordersData.map((order) => {
          const couponUsage = couponUsageMap.get(order.id);
          return {
            ...order,
            payment_wallet: paymentWalletMap.get(order.id) ?? null,
            coupon_discount: couponUsage?.discount_amount ?? 0,
            coupon_code: couponUsage?.code ?? null,
            items: (order.order_items ?? []).map((item) => ({
              ...item,
              products: item.products
                ? {
                    ...item.products,
                    images: productImagesMap.get(item.product_id) ?? [],
                  }
                : null,
            })),
          };
        });
        setOrders(mappedOrders as unknown as ProfileOrder[]);
      }
      if (addressRes.data) setAddresses(addressRes.data);

      // Fetch point balance
      const { data: pointTxns } = await supabase
        .from("point_transactions")
        .select("amount")
        .eq("user_id", user.id);
      if (pointTxns) {
        const balance = pointTxns.reduce((sum, t) => sum + t.amount, 0);
        setPointBalance(balance);
      }

      setLoading(false);
    };
    fetchAll();

    // Real-time subscription for order updates
    const channel = supabase
      .channel("profile-orders")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const updatedOrder = payload.new as {
            id: string;
            user_id: string;
            status: string;
            delivery_status: string;
            payment_status: string;
            updated_at: string;
            is_deleted?: boolean;
          };
          if (updatedOrder.user_id !== userId) return;

          // Soft-delete: drop the row from `orders`. Without this, the
          // realtime callback would .map() over the existing list and the
          // OrdersContent useEffect that mirrors `orders` into `localOrders`
          // would re-surface the just-deleted order until a hard refresh.
          if (updatedOrder.is_deleted === true) {
            setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
            return;
          }

          // Soft-undelete (callback resurrected an order after the user
          // canceled it but ended up paying anyway). If we already have it,
          // patch it; otherwise leave it for the next full fetch.
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === updatedOrder.id
                ? {
                    ...order,
                    status: updatedOrder.status,
                    delivery_status: updatedOrder.delivery_status,
                    payment_status: updatedOrder.payment_status,
                    updated_at: updatedOrder.updated_at,
                  }
                : order,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mobile orders filter logic
  const mobileOrderTabs = ["Захиалсан", "Хүргэгдсэн", "Цуцлагдсан"] as const;
  const filterOrderByTab = (order: ProfileOrder, tabIndex: number) => {
    if (tabIndex === 1) return order.delivery_status === "delivered";
    if (tabIndex === 2)
      return (
        order.payment_status === "failed" ||
        order.delivery_status === "canceled"
      );
    return (
      order.delivery_status !== "delivered" &&
      order.delivery_status !== "canceled" &&
      order.payment_status !== "failed"
    );
  };
  const mobileFilteredOrders = orders.filter((o) =>
    filterOrderByTab(o, mobileOrderTab),
  );
  const getMobileTabCount = (tabIndex: number) =>
    orders.filter((o) => filterOrderByTab(o, tabIndex)).length;

  const mobileEmptyState: Record<
    number,
    { icon: React.ReactNode; text: string }
  > = {
    0: { icon: <Box />, text: "Захиалсан бараа алга байна" },
    1: { icon: <TruckGray />, text: "Хүргэгдсэн бараа алга байна" },
    2: { icon: <BoxCancel />, text: "Цуцлагдсан бараа алга байна" },
  };

  const activeMenu: SideMenu =
    view.type === "address-edit"
      ? "address"
      : view.type === "branches" || view.type === "faq"
        ? "help"
        : (view.type as SideMenu);

  const handleMenuChange = (menu: SideMenu) => {
    if (menu === "logout") {
      setShowLogoutModal(true);
      return;
    }
    if (menu === "wishlist") {
      router.push("/wishlist");
      return;
    }
    // Show activation modal without navigating when point not activated
    if (menu === "point" && !userData?.point_activated_at) {
      setShowActivation(true);
      return;
    }
    // Navigate with URL param for mobile back navigation support
    router.push(`/profile?tab=${menu}`);
    setView({ type: menu as View["type"] });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleEditAddress = (id: string) => {
    router.push(`/profile?tab=address&action=edit&id=${id}`);
  };

  const handleAddNewAddress = () => {
    router.push("/profile?tab=address&action=new");
  };

  const handleBackFromEdit = () => {
    router.push("/profile?tab=address");
  };

  const refreshAddresses = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const addressRes = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (addressRes.data) setAddresses(addressRes.data);
  };

  const refreshUser = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const userRes = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (userRes.data) setUserData(userRes.data);
  };

  if (loading) {
    return (
      <div className="w-full bg-white flex justify-center min-h-screen">
        <div className="flex flex-col max-w-[1064px] w-full pb-12 px-4 md:px-6 lg:px-0">
          <p className="px-0.5 pb-2 pt-6 md:pt-10 lg:pt-[52px] text-[#020617] font-bold text-xl md:text-2xl lg:text-[26px] leading-7 md:leading-8 lg:leading-9 font-manrope">
            Профайл
          </p>
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#020617] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white flex justify-center">
      <div
        className={`flex flex-col max-w-[1064px] w-full py-5 md:py-4 lg:px-0 ${tabParam === "point" ? "px-0 md:px-6" : "px-4 md:px-6"}`}
      >
        {/* Title - only show when a tab is selected on mobile, always on desktop */}
        <p
          className={`px-0.5 pb-2 mb-0 md:mb-[10px] text-[#020617] font-bold text-xl md:text-2xl lg:text-[26px] leading-7 md:leading-8 lg:leading-9 font-manrope ${tabParam ? "hidden lg:block" : ""}`}
        >
          Профайл
        </p>

        {/* Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 items-start">
          {/* Left Sidebar - Always visible on desktop, only when no tab selected on mobile */}
          <div
            className={`w-full lg:w-auto ${tabParam ? "hidden lg:block" : ""}`}
          >
            <ProfileSidebar
              activeMenu={activeMenu}
              onMenuChange={handleMenuChange}
              user={userData}
              defaultAddress={
                addresses.find((a) => a.is_default) ?? addresses[0] ?? null
              }
              wishlistCount={wishlistItems.length}
              couponCount={couponCount}
              pointBalance={pointBalance}
            />

            {/* Mobile Recent Orders Section */}
            <div className="lg:hidden">
              {/* Gray divider */}
              <div className="bg-[#F8FAFC] h-2 -mx-4" />

              {/* Orders header */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center py-0.5">
                  <div className="ml-[-4px] w-8 h-8 relative">
                    <Image
                      src="/orders.png"
                      alt="orders"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-[#020617] font-medium text-lg font-manrope">
                    Сүүлийн захиалгууд
                  </p>
                </div>
                <button
                  onClick={() => handleMenuChange("orders")}
                  className="flex items-center gap-0.5 py-2 cursor-pointer"
                >
                  <span className="text-[#64748B] font-medium text-sm font-manrope">
                    Бүх захиалга
                  </span>
                  <ChevronRight16Gray />
                </button>
              </div>

              {/* Filter chips */}
              <div className="flex gap-2 pt-2 pb-1 overflow-x-auto scrollbar-hide">
                {mobileOrderTabs.map((tab, index) => {
                  const count = getMobileTabCount(index);
                  return (
                    <div key={tab} className="relative w-full">
                      <button
                        onClick={() => setMobileOrderTab(index)}
                        className={`w-full h-8 px-4 rounded-full text-sm border font-manrope font-normal cursor-pointer transition-colors ${
                          index === mobileOrderTab
                            ? "bg-[#020617] border-[#020617] text-white font-medium"
                            : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {tab}
                      </button>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#020617] text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Order cards */}
              <div className="flex flex-col gap-5 py-4">
                {mobileFilteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="p-[9px]">
                      {mobileEmptyState[mobileOrderTab].icon}
                    </div>
                    <p className="text-[#64748B] font-normal text-base font-manrope">
                      {mobileEmptyState[mobileOrderTab].text}
                    </p>
                  </div>
                ) : (
                  mobileFilteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onMoreClick={() =>
                        router.push(`/profile?tab=orders&orderId=${order.id}`)
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Always visible on desktop, only when tab selected on mobile */}
          <div
            className={`w-full lg:w-[720px] lg:shrink-0 ${tabParam ? "" : "hidden lg:block"}`}
          >
            {view.type === "orders" && (
              <OrdersContent
                orders={orders}
                addresses={addresses}
                user={userData}
                initialOrderId={orderIdParam}
              />
            )}
            {view.type === "connections" && <ConnectionsContent />}
            {view.type === "phone" && (
              <PhoneContent user={userData} onRefresh={refreshUser} />
            )}
            {view.type === "personal" && (
              <PersonalContent user={userData} onRefresh={refreshUser} />
            )}
            {view.type === "address" && (
              <AddressContent
                addresses={addresses}
                onEditAddress={handleEditAddress}
                onAddNew={handleAddNewAddress}
                onRefresh={refreshAddresses}
              />
            )}
            {view.type === "address-edit" && (
              <AddressEditContent
                addressId={view.addressId}
                existingAddress={addresses.find((a) => a.id === view.addressId)}
                onBack={handleBackFromEdit}
                onSave={refreshAddresses}
              />
            )}
            {view.type === "point" && (
              <PointContent onBalanceChange={setPointBalance} />
            )}
            {view.type === "coupon" && (
              <CouponContent onCouponCountChange={setCouponCount} />
            )}
            {view.type === "settings" && (
              <SettingsContent
                user={userData}
                defaultAddress={
                  addresses.find((a) => a.is_default) ?? addresses[0] ?? null
                }
                onNavigate={handleMenuChange}
              />
            )}
            {view.type === "help" && <HelpContent />}
            {view.type === "branches" && <BranchesContent />}
            {view.type === "faq" && <FAQContent />}
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
      <PointActivation
        isOpen={showActivation}
        hasPhone={!!userData?.primary_phone}
        onActivate={async () => {
          const result = await activatePoints();
          if (result.success) {
            setShowActivation(false);
            await refreshUser();
            setShowActivationSuccess(true);
          } else if (!result.success && result.error === "phone_not_verified") {
            setShowActivation(false);
            setShowPhoneVerification(true);
          }
        }}
        onNavigateToPhone={() => {
          setShowActivation(false);
          setShowPhoneVerification(true);
        }}
        onClose={() => setShowActivation(false)}
      />
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onVerified={async () => {
          setShowPhoneVerification(false);
          await refreshUser();
          const result = await activatePoints();
          if (result.success) {
            setShowActivationSuccess(true);
          }
        }}
      />
      <PointActivationSuccessModal
        isOpen={showActivationSuccess}
        onClose={() => {
          setShowActivationSuccess(false);
          setShowActivation(false);
        }}
        onViewBalance={() => {
          setShowActivationSuccess(false);
          setShowActivation(false);
          handleMenuChange("point");
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-white flex justify-center min-h-screen">
          <div className="flex flex-col max-w-[1064px] w-full pb-12 px-4 md:px-6 lg:px-0">
            <p className="px-0.5 pb-2 pt-6 md:pt-10 lg:pt-[52px] text-[#020617] font-bold text-xl md:text-2xl lg:text-[26px] leading-7 md:leading-8 lg:leading-9 font-manrope">
              Профайл
            </p>
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#020617] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
