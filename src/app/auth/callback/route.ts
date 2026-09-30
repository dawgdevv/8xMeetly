import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// GET /auth/callback — Supabase OAuth (Google) code exchange.
// Supabase redirects here after the provider authenticates the user.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const fail = () =>
    NextResponse.redirect(`${origin}/login?error=oauth_failed`);

  if (!code || !isSupabaseConfigured()) return fail();

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail();

  // Behind a proxy/load balancer, prefer the forwarded host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV === "development") {
    return NextResponse.redirect(`${origin}${next}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
