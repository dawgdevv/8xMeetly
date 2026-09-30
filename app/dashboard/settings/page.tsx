import Image from "next/image";
import { CreditCard, Mail, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  let email: string | null = null;
  let name: string | null = null;
  let avatarUrl: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
    const metadata = user?.user_metadata as
      | { full_name?: unknown; name?: unknown; avatar_url?: unknown; picture?: unknown }
      | undefined;
    name =
      (typeof metadata?.full_name === "string" && metadata.full_name) ||
      (typeof metadata?.name === "string" && metadata.name) ||
      email?.split("@")[0] ||
      null;
    avatarUrl =
      (typeof metadata?.avatar_url === "string" && metadata.avatar_url) ||
      (typeof metadata?.picture === "string" && metadata.picture) ||
      null;
  } catch {
    // Skeleton mode.
  }

  const initials = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <BackButton fallbackHref="/dashboard" />
      <h1 className="mt-4 text-balance text-[27px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">
        Settings
      </h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-muted sm:text-[15px]">Your account profile and plan.</p>

      <section aria-labelledby="profile-heading">
        <div className="mb-3">
          <h2 id="profile-heading" className="text-base font-extrabold tracking-tight text-ink">Personal profile</h2>
          <p className="mt-1 text-sm text-muted">Your identity associated with this workspace.</p>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-4 border-b border-border bg-background/70 p-5 sm:gap-5 sm:p-6">
            <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-xl font-bold text-white ring-4 ring-white shadow-sm sm:h-[76px] sm:w-[76px]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name ? `${name}'s profile photo` : "Profile photo"}
                  width={76}
                  height={76}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : initials ? (
                initials
              ) : (
                <UserRound size={28} strokeWidth={1.8} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Workspace account</p>
              <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-ink sm:text-[22px]">
                {name ?? "Your profile"}
              </h2>
              <p className="mt-1 text-sm text-muted">Profile details from your Google account</p>
            </div>
          </div>
          <dl className="grid gap-0 sm:grid-cols-2">
            <div className="flex min-w-0 items-start gap-3 p-5 sm:p-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                <UserRound size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Name</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-ink">{name ?? "Not set"}</dd>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-3 border-t border-border p-5 sm:border-l sm:border-t-0 sm:p-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink">
                <Mail size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Email</dt>
                <dd className="mt-1 break-all text-sm font-semibold text-ink">{email ?? "Not signed in"}</dd>
              </div>
            </div>
          </dl>
        </Card>
      </section>

      <section aria-labelledby="plan-heading" className="mt-8">
        <div className="mb-3">
          <h2 id="plan-heading" className="text-base font-extrabold tracking-tight text-ink">Your plan</h2>
          <p className="mt-1 text-sm text-muted">Plan details for this workspace.</p>
        </div>
        <Card className="flex items-center gap-4 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-peach text-ink">
            <CreditCard size={20} strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-ink">Starter</p>
            <p className="mt-1 text-sm leading-5 text-muted">Unlimited meetings during beta</p>
          </div>
          <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1.5 text-xs font-bold text-green-800">
            Active
          </span>
        </Card>
      </section>
    </div>
  );
}
