import { createClient } from "@supabase/supabase-js";

// Service-role client — server-side only (webhooks, AI pipeline).
// Never import this from a Client Component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, serviceKey, {
    auth: { persistSession: false },
  });
}
