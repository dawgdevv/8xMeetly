import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Untyped client — tables are defined in supabase/migrations + src/types/database.ts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any>(url, anonKey);
}
