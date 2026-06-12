"use client";

import { useEffect, useState } from "react";

import {
  assembleProfileOrders,
  buildCouponUsageMap,
  buildPaymentWalletMap,
  buildProductImagesMap,
  collectProductIds,
  type OrderRowEmbed,
} from "@/app/profile/_lib/orderMappers";
import { createClient } from "@/lib/supabase/client";

import type { ProfileOrder } from "@/app/profile/page";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface UseProfileDataResult {
  userData: UserRow | null;
  setUserData: React.Dispatch<React.SetStateAction<UserRow | null>>;
  orders: ProfileOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ProfileOrder[]>>;
  addresses: AddressRow[];
  setAddresses: React.Dispatch<React.SetStateAction<AddressRow[]>>;
  pointBalance: number;
  setPointBalance: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  refreshAddresses: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

async function fetchPaymentAndCouponMaps(
  supabase: ReturnType<typeof createClient>,
  orderIds: string[],
) {
  if (orderIds.length === 0) {
    return {
      paymentWalletMap: new Map<string, string>(),
      couponUsageMap: new Map<string, { discount_amount: number; code: string }>(),
    };
  }

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

  return {
    paymentWalletMap: buildPaymentWalletMap(invoicesRes.data),
    couponUsageMap: buildCouponUsageMap(couponUsagesRes.data),
  };
}

async function fetchEnrichedOrders(
  supabase: ReturnType<typeof createClient>,
  ordersData: OrderRowEmbed[],
): Promise<ProfileOrder[]> {
  const productIds = collectProductIds(ordersData);

  const productImagesMap =
    productIds.length === 0
      ? new Map<string, string[]>()
      : await supabase
          .from("product_images")
          .select("product_id, url, sort_order")
          .in("product_id", productIds)
          .is("variant_id", null)
          .order("sort_order", { ascending: true })
          .then(({ data }) => buildProductImagesMap(data));

  const orderIds = ordersData.map((o) => o.id).filter(Boolean) as string[];
  const { paymentWalletMap, couponUsageMap } = await fetchPaymentAndCouponMaps(supabase, orderIds);

  return assembleProfileOrders(ordersData, productImagesMap, paymentWalletMap, couponUsageMap);
}

export function useProfileData(): UseProfileDataResult {
  const [userData, setUserData] = useState<UserRow | null>(null);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [pointBalance, setPointBalance] = useState(0);
  const [loading, setLoading] = useState(true);

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
        const ordersData = ordersRes.data as unknown as OrderRowEmbed[];
        const enriched = await fetchEnrichedOrders(supabase, ordersData);
        setOrders(enriched);
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

    const userRes = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();

    if (userRes.data) setUserData(userRes.data);
  };

  return {
    userData,
    setUserData,
    orders,
    setOrders,
    addresses,
    setAddresses,
    pointBalance,
    setPointBalance,
    loading,
    refreshAddresses,
    refreshUser,
  };
}
