"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export interface SuccessInfo {
  code: string;
  label: string;
}

function getCouponLabel(type: string, value: number): string {
  if (type === "percentage") return `${value}% -н купон`;
  if (type === "fixed") return `${value.toLocaleString()}₮ -н купон`;
  return "Үнэгүй хүргэлт купон";
}

interface ClaimResult {
  error?: string;
  success?: SuccessInfo;
}

async function claimCouponByCode(rawCode: string): Promise<ClaimResult> {
  const trimmedCode = rawCode.trim().toUpperCase();
  if (!trimmedCode) {
    return { error: "Купон код оруулна уу" };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Нэвтэрч орно уу" };

    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select(
        "id, code, type, discount_value, is_active, start_date, end_date, usage_limit, usage_count",
      )
      .eq("code", trimmedCode)
      .maybeSingle();

    if (couponError || !coupon) return { error: "Купон код буруу байна" };

    const { data: existing } = await supabase
      .from("user_coupons")
      .select("id")
      .eq("user_id", user.id)
      .eq("coupon_id", coupon.id)
      .maybeSingle();

    if (existing) return { error: "Та энэ купоныг аль хэдийн нэмсэн байна" };

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { error: "Купоны ашиглалтын хязгаар дууссан байна" };
    }

    const { error: insertError } = await supabase.from("user_coupons").insert({
      user_id: user.id,
      coupon_id: coupon.id,
    });

    if (insertError) return { error: "Купон нэмэхэд алдаа гарлаа" };

    return {
      success: {
        code: coupon.code,
        label: getCouponLabel(coupon.type, Number(coupon.discount_value)),
      },
    };
  } catch {
    return { error: "Алдаа гарлаа. Дахин оролдоно уу" };
  }
}

export function useAddCoupon(isOpen: boolean) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode("");
      setError(null);
      setSuccessInfo(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const result = await claimCouponByCode(code);
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccessInfo(result.success);
    }
    setLoading(false);
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (error) setError(null);
  };

  return {
    code,
    loading,
    error,
    successInfo,
    handleSubmit,
    handleCodeChange,
  };
}
