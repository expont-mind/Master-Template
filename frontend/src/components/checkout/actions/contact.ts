"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactPayload } from "./_shared";

export async function saveContact(contact: ContactPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: contact.firstName,
      last_name: contact.lastName,
      primary_phone: contact.phone1.replace(/^\+?976/, ""),
      secondary_phone: contact.phone2 ? contact.phone2.replace(/^\+?976/, "") : "",
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Холбоо барих мэдээлэл хадгалахад алдаа гарлаа" };
  }

  return { success: true };
}

export async function updateOrderPaymentMethod(
  orderId: string,
  paymentMethod: "qpay" | "transfer",
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  const admin = createAdminClient();

  // DB trigger (set_paid_at_on_payment) automatically handles paid_at:
  // - transfer + unpaid → paid_at = created_at (appears among paid orders)
  // - switching away from transfer → paid_at = NULL
  // - payment confirmed → paid_at = NOW()
  const { error } = await admin
    .from("orders")
    .update({ payment_method: paymentMethod })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .eq("payment_status", "unpaid");

  if (error) {
    return { success: false, error: "Төлбөрийн хэлбэр өөрчлөхөд алдаа гарлаа" };
  }

  return { success: true };
}
