import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Middleware cookie байвал DB query алгасах (хурдан)
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin-verified");

  if (adminCookie?.value !== user.id) {
    // Cookie байхгүй → DB-ээс шалгах (defence in depth)
    const adminClient = createAdminClient();
    const { data: admin } = await adminClient
      .from("admins")
      .select("id")
      .eq("email", user.email!)
      .maybeSingle();

    if (!admin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: altEmail } = await (adminClient as any)
        .from("admin_login_emails")
        .select("admin_id")
        .eq("email", user.email!)
        .eq("is_verified", true)
        .single();

      if (!altEmail) {
        redirect("/login");
      }
    }
  }

  return (
    <AdminShell
      user={{
        email: user.email || "",
        name: user.user_metadata?.full_name,
      }}
    >
      {children}
    </AdminShell>
  );
}
