import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let accountName: string | null = null;
  let accountAvatar: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const metadata = user?.user_metadata as
      | { full_name?: unknown; name?: unknown; avatar_url?: unknown; picture?: unknown }
      | undefined;
    accountName =
      (typeof metadata?.full_name === "string" && metadata.full_name) ||
      (typeof metadata?.name === "string" && metadata.name) ||
      user?.email?.split("@")[0] ||
      null;
    accountAvatar =
      (typeof metadata?.avatar_url === "string" && metadata.avatar_url) ||
      (typeof metadata?.picture === "string" && metadata.picture) ||
      null;
  } catch {
    // Keep the dashboard shell available if account metadata is unavailable.
  }

  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-6">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1440px] gap-4 sm:min-h-[calc(100vh-2.5rem)] sm:gap-5 lg:min-h-[calc(100vh-3rem)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
          <Topbar accountName={accountName} accountAvatar={accountAvatar} />
          <main id="main" className="min-w-0 flex-1 pb-28 md:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
