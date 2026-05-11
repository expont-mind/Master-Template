import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const ADMIN_ROUTE_PREFIXES = [
  "/dashboard",
  "/products",
  "/orders",
  "/users",
  "/settings",
];

const ADMIN_COOKIE_NAME = "admin-verified";
// 5 минут. 15 байсныг богиносгосон — `admins` хүснэгтээс хасагдсан хэрэглэгч
// дээд тал нь 5 минут админ эрхтэй үлддэг.
const ADMIN_COOKIE_MAX_AGE = 60 * 5;

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );
  const isLoginPage = pathname === "/login";

  // FAST PATH: admin route ч биш, login ч биш бол Supabase огт хөндөхгүй
  if (!isAdminRoute && !isLoginPage) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Нэвтрээгүй + admin route → login руу
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin эсэхийг шалгах (cookie-гоор cache хийнэ)
  if (user && (isAdminRoute || isLoginPage)) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    const isVerifiedAdmin = adminCookie?.value === user.id;

    if (!isVerifiedAdmin) {
      const adminClient = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
        },
      );

      // Үндсэн имэйлээр шалгах
      const { data: admin } = await adminClient
        .from("admins")
        .select("id")
        .eq("email", user.email!)
        .single();

      // Нэмэлт имэйлээр шалгах (үндсэн имэйлээр олдоогүй бол)
      if (!admin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: altEmail } = await (adminClient as any)
          .from("admin_login_emails")
          .select("admin_id")
          .eq("email", user.email!)
          .eq("is_verified", true)
          .single();

        if (!altEmail) {
          if (isAdminRoute) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
          }
          return supabaseResponse;
        }
      }

      // Verified → cookie тавих (15 минут хүчинтэй)
      supabaseResponse.cookies.set(ADMIN_COOKIE_NAME, user.id, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: ADMIN_COOKIE_MAX_AGE,
        path: "/",
      });
    }

    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
