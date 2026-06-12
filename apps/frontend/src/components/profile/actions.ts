"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";

interface UnlinkIdentityPayload {
  provider: string;
}

// Map raw Postgres / network errors to user-friendly Mongolian messages.
// We never want users to see "violates foreign key constraint" or English
// stack traces; those are logged server-side instead.
//
// Each rule is `{ match, message }` where `match` is a list of substring
// AND-groups (any group matching = rule fires). The first matching rule wins.
const ORDER_DELETE_ERROR_RULES: ReadonlyArray<{
  match: ReadonlyArray<ReadonlyArray<string>>;
  message: string;
}> = [
  {
    match: [["point_transactions", "foreign key"]],
    message:
      "Энэ захиалгад холбоотой оноо бүртгэл байгаа тул одоогоор устгах боломжгүй байна. Тусламжийн төвд хандана уу.",
  },
  {
    match: [
      ["payments_order", "foreign key"],
      ["payment_invoices", "foreign key"],
    ],
    message:
      "Энэ захиалгад холбоотой төлбөрийн бичлэг байгаа тул одоогоор устгах боломжгүй байна. Тусламжийн төвд хандана уу.",
  },
  {
    match: [["foreign key"]],
    message: "Энэ захиалгыг одоогоор устгах боломжгүй байна. Тусламжийн төвд хандана уу.",
  },
  {
    match: [["permission denied"], ["not authorized"], ["jwt"]],
    message: "Нэвтрэлт дууссан байна. Дахин нэвтэрч орно уу.",
  },
  {
    match: [["network"], ["fetch failed"], ["failed to fetch"]],
    message: "Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу.",
  },
  {
    match: [["timeout"], ["timed out"]],
    message: "Серверийн хариу удааширлаа. Дахин оролдоно уу.",
  },
];

const DEFAULT_ORDER_DELETE_ERROR = "Захиалга устгахад алдаа гарлаа. Дахин оролдоно уу.";

function friendlyOrderDeleteError(raw: string | undefined | null): string {
  const msg = (raw ?? "").toLowerCase();
  for (const rule of ORDER_DELETE_ERROR_RULES) {
    if (rule.match.some((group) => group.every((token) => msg.includes(token)))) {
      return rule.message;
    }
  }
  return DEFAULT_ORDER_DELETE_ERROR;
}

// Delete an unpaid order. Mirrors mobile's ProfileController.cancelOrder
// (mobile/lib/src/profile/controllers/profile_controller.dart:449-459) which
// calls the same `delete_unpaid_order` RPC. The canonical RPC is defined in
// migration 20260501000000_delete_unpaid_order_rpc.sql — it returns a jsonb
// {success, error?} payload after FK cleanup (point_transactions, payments,
// payment_invoices) and ownership / payment_status checks.
export async function deleteUnpaidOrder(
  orderId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  try {
    const { data, error } = await supabase.rpc("delete_unpaid_order", {
      p_order_id: orderId,
    });

    if (error) {
      log.error("delete_unpaid_order_rpc_error", error);
      return { success: false, error: friendlyOrderDeleteError(error.message) };
    }

    // The canonical RPC returns jsonb { success, error?, order_id? }.
    // Older production versions may return null or void — treat absence of
    // explicit failure as success.
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      (data as { success?: boolean }).success === false
    ) {
      const errObj = data as { success: false; error?: string };
      // RPC's own error messages are already Mongolian + actionable
      // (e.g. "Захиалга олдсонгүй", "Энэ захиалгыг устгах эрхгүй"), so
      // pass them through as-is.
      return {
        success: false,
        error:
          typeof errObj.error === "string" && errObj.error.length > 0
            ? errObj.error
            : "Захиалга устгахад алдаа гарлаа. Дахин оролдоно уу.",
      };
    }

    return { success: true };
  } catch (err) {
    log.error("delete_unpaid_order_unexpected_error", err);
    const raw = err instanceof Error ? err.message : null;
    return { success: false, error: friendlyOrderDeleteError(raw) };
  }
}

export async function activatePoints(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const admin = createAdminClient();

    const { data: userData } = await admin
      .from("users")
      .select("point_activated_at, primary_phone")
      .eq("id", user.id)
      .single();

    if (userData?.point_activated_at) {
      return { success: false, error: "already_activated" };
    }

    if (!userData?.primary_phone) {
      return { success: false, error: "phone_not_verified" };
    }

    // Set point_activated_at
    const { error: updateError } = await admin
      .from("users")
      .update({ point_activated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Insert 5,000 point welcome bonus
    const { error: bonusError } = await admin.from("point_transactions").insert({
      user_id: user.id,
      type: "promotional",
      amount: 5000,
      description: "Шинэ хэрэглэгчийн бонус",
    });

    if (bonusError) {
      log.error("welcome_bonus_insert_failed", bonusError);
    }

    return { success: true };
  } catch (err) {
    log.error("activate_points_failed", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to activate points",
    };
  }
}

export async function unlinkIdentity(
  payload: UnlinkIdentityPayload,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the identity belongs to this user
  const identity = user.identities?.find((i) => i.provider === payload.provider);

  if (!identity) {
    return { success: false, error: "Identity not found" };
  }

  // Don't allow unlinking if it's the only identity
  if (user.identities && user.identities.length <= 1) {
    return {
      success: false,
      error: "Хамгийн сүүлийн холболтыг салгах боломжгүй",
    };
  }

  try {
    const admin = createAdminClient();

    // Use RPC to call a database function that deletes from auth.identities
    // Delete by provider and user_id instead of identity id
    const { error } = await admin.rpc("delete_user_identity", {
      p_provider: payload.provider,
      p_user_id: user.id,
    });

    if (error) {
      log.error("unlink_identity_rpc_failed", { message: error.message });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    log.error("unlink_identity_unexpected_error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to unlink identity",
    };
  }
}
