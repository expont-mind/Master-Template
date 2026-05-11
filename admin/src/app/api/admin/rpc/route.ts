import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FUNCTIONS = ["save_product", "get_variant_details_batch", "get_product_performance", "get_variant_sales", "decrement_order_stock", "restore_order_stock", "get_users_with_stats", "get_order_heatmap", "get_returning_vs_new_users", "get_top_spenders", "get_coupon_analytics", "record_order_points_and_coupon", "refund_order_points_and_coupon"];

export async function POST(request: NextRequest) {
  try {
    const { fn, params } = await request.json();

    if (!fn || !ALLOWED_FUNCTIONS.includes(fn)) {
      return NextResponse.json(
        { error: `Invalid or disallowed function: ${fn}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc(fn, params);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin RPC error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
