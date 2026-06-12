import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { Database } from "@/types/database";

const PROTECTED_PATHS = ["/account", "/checkout", "/orders"];
const AUTH_PATHS = ["/login", "/register"];

function clearStaleChunkedCookies(request: NextRequest, response: NextResponse) {
  const allCookies = request.cookies.getAll();
  const chunkedCookieNames = allCookies
    .map((c) => c.name)
    .filter((name) => /^sb-.*-auth-token\.\d+$/.test(name));

  if (chunkedCookieNames.length > 5) {
    chunkedCookieNames.forEach((name) => {
      response.cookies.delete(name);
    });
  }
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // FAST PATH: public хуудас → Supabase руу огт очихгүй
  if (!isProtectedPath && !isAuthPath) {
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

  clearStaleChunkedCookies(request, supabaseResponse);

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
