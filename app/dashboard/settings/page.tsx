import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  let email: string | null = null;
  let name: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
    name = (user?.user_metadata?.full_name as string | undefined) ?? null;
  } catch {
    // Skeleton mode.
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <BackButton fallbackHref="/dashboard" />
      <h1 className="mt-4 text-balance text-[27px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">
        Settings
      </h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-muted sm:text-[15px]">Your workspace preferences.</p>
      <Card className="divide-y divide-border p-0">
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">Name</p>
            <p className="truncate text-sm text-muted">{name ?? "Not set"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">Email</p>
            <p className="truncate text-sm text-muted">{email ?? "Not signed in"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">Plan</p>
            <p className="text-sm text-muted">Starter — unlimited meetings during beta</p>
          </div>
          <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
            Active
          </span>
        </div>
      </Card>
    </div>
  );
}
