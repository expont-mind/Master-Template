"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export interface AddressWithId {
  id: string;
  name: string;
  city: string;
  district: string;
  sub_district: string;
  detail: string;
  is_default: boolean;
}

export const addressKeys = {
  all: ["addresses"] as const,
  list: (userId: string | undefined) =>
    [...addressKeys.all, "list", userId] as const,
  default: (userId: string | undefined) =>
    [...addressKeys.all, "default", userId] as const,
};

export function useDefaultAddress(userId: string | undefined) {
  return useQuery({
    queryKey: addressKeys.default(userId),
    queryFn: async (): Promise<AddressRow | null> => {
      if (!userId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .eq("is_default", true)
        .single();

      if (error) {
        const { data: anyAddress } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", userId)
          .limit(1)
          .single();

        return anyAddress || null;
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllAddresses(userId: string | undefined) {
  return useQuery({
    queryKey: addressKeys.list(userId),
    queryFn: async (): Promise<AddressWithId[]> => {
      if (!userId) return [];

      const supabase = createClient();
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      return (data || []).map((addr) => ({
        id: addr.id,
        name: addr.name || "",
        city: addr.city || "",
        district: addr.district || "",
        sub_district: addr.sub_district || "",
        detail: addr.detail || "",
        is_default: addr.is_default,
      }));
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetDefaultAddress(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!userId) throw new Error("No user");

      const supabase = createClient();

      // Remove default from all addresses
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);

      // Set new default
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: addressKeys.default(userId) });
    },
  });
}
