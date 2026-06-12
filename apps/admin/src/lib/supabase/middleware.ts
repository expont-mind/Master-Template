import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const ADMIN_ROUTE_PREFIXES = ["/dashboard", "/products", "/orders", "/users", "/settings"];

const ADMIN_COOKIE_NAME = "admin-verified";
// 5 минут. 15 байсныг богиносгосон — `admins` хүснэгтээс хасагдсан хэрэглэгч
// дээд тал нь 5 минут админ эрхтэй үлддэг.
const ADMIN_COOKIE_MAX_AGE = 60 * 5;

interface RouteFlags {
  isAdminRoute: boolean;
  isLoginPage: boolean;
}

function classifyRoute(pathname: string): RouteFlags {
  return {
    isAdminRoute: ADMIN_ROUTE_PREFIXES.some((p) => pathname.startsWith(p)),
    isLoginPage: pathname === "/login",
  };
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

function buildDashboardRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
}

interface AdminLookupResult {
  isAdmin: boolean;
}

async function lookupAdminByEmail(email: string): Promise<AdminLookupResult> {
  const adminClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );

  // Үндсэн имэйлээр шалгах
  const { data: admin } = await adminClient.from("admins").select("id").eq("email", email).single();

  if (admin) return { isAdmin: true };

  // Нэмэлт имэйлээр шалгах (үндсэн имэйлээр олдоогүй бол)
  const { data: altEmail } = await adminClient
    .from("admin_login_emails")
    .select("admin_id")
    .eq("email", email)
    .eq("is_verified", true)
    .single<{ admin_id: string }>();

  return { isAdmin: !!altEmail };
}

function setAdminCookie(response: NextResponse, userId: string) {
  response.cookies.set(ADMIN_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Verifies the user is an admin (using the verified-admin cookie when set,
 * otherwise hitting Supabase). Returns either a redirect response, or
 * `null` when the caller should proceed with the request normally.
 */
async function verifyAdminAccess(input: {
  request: NextRequest;
  user: { id: string; email?: string };
  supabaseResponse: NextResponse;
  isAdminRoute: boolean;
  isLoginPage: boolean;
}): Promise<NextResponse | null> {
  const { request, user, supabaseResponse, isAdminRoute, isLoginPage } = input;
  const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME);
  const isVerifiedAdmin = adminCookie?.value === user.id;

  if (!isVerifiedAdmin) {
    const { isAdmin } = await lookupAdminByEmail(user.email!);
    if (!isAdmin) {
      if (isAdminRoute) return buildLoginRedirect(request);
      return supabaseResponse;
    }
    // Verified → cookie тавих (5 минут хүчинтэй)
    setAdminCookie(supabaseResponse, user.id);
  }

  if (isLoginPage) return buildDashboardRedirect(request);
  return null;
}

export async function updateSession(request: NextRequest) {
  const { isAdminRoute, isLoginPage } = classifyRoute(request.nextUrl.pathname);

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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
    return buildLoginRedirect(request);
  }

  // Admin эсэхийг шалгах (cookie-гоор cache хийнэ)
  if (user && (isAdminRoute || isLoginPage)) {
    const verifyResult = await verifyAdminAccess({
      request,
      user,
      supabaseResponse,
      isAdminRoute,
      isLoginPage,
    });
    if (verifyResult) return verifyResult;
  }

  return supabaseResponse;
}
