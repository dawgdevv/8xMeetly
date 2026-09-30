import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from "./env";

// Copy refreshed session cookies AND cache headers onto a new response.
// Returning an earlier response drops the refreshed cookies and signs
// the user out on the next request.
function carrySession(target: NextResponse, source: NextResponse) {
  target.cookies.setAll(source.cookies.getAll());
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}

export async function updateSession(request: NextRequest) {
  // Skip auth refresh when Supabase is not configured (local skeleton mode).
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl(),
    supabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options?: any;
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() verifies the token signature — never trust getSession()
  // in server code, it reads the cookie without revalidating.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;

  // Protect /dashboard — redirect to login when unauthenticated.
  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return carrySession(NextResponse.redirect(url), supabaseResponse);
  }

  // Authenticated users don't need the auth pages.
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return carrySession(NextResponse.redirect(url), supabaseResponse);
  }

  return supabaseResponse;
}
