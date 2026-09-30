import { createClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "./env";

// Service-role client — server-side only (webhooks, AI pipeline).
// Never import this from a Client Component.
export function createAdminClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false },
  });
}
