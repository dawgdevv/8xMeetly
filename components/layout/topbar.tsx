"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";

export function Topbar({
  accountName,
  accountAvatar,
}: {
  accountName: string | null;
  accountAvatar: string | null;
}) {
  const router = useRouter();
  const initials = accountName
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase not configured — just leave.
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-border/90 bg-card/90 py-2 pl-4 pr-3 shadow-[0_8px_28px_-22px_rgb(41_39_33/0.32)] backdrop-blur md:min-h-[58px] md:rounded-[22px] md:pl-5 md:pr-4">
      <Link href="/dashboard" aria-label="8xMeetly dashboard home" className="md:hidden">
        <Logo />
      </Link>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/dashboard/settings"
          aria-label={`Account settings${accountName ? ` for ${accountName}` : ""}`}
          title="Account settings"
          className="group flex min-h-10 items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2.5 transition-[background-color,border-color] hover:border-border hover:bg-background focus-visible:border-primary/40 sm:gap-2.5 sm:pr-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-[11px] font-bold text-white ring-1 ring-border/70 transition-shadow group-hover:ring-primary/30">
            {accountAvatar ? (
              <Image
                src={accountAvatar}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : initials ? (
              initials
            ) : (
              <UserRound size={16} aria-hidden="true" />
            )}
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-36 truncate text-[13px] font-bold leading-4 text-ink">
              {accountName ?? "Account"}
            </span>
            <span className="mt-0.5 block text-[11px] leading-3 text-muted">Profile &amp; settings</span>
          </span>
        </Link>
        <span aria-hidden="true" className="mx-0.5 h-7 w-px bg-border sm:mx-1" />
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-10 items-center gap-2 rounded-full px-2.5 py-2 text-sm font-semibold text-stone-500 transition-[background-color,color] hover:bg-ink/[0.05] hover:text-foreground sm:px-3"
        >
          <LogOut size={16} strokeWidth={2.25} aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
          <span className="sr-only sm:hidden">Sign out</span>
        </button>
      </div>
    </header>
  );
}
