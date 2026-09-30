"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";

export function Topbar() {
  const router = useRouter();

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
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-stone-500 transition-[background-color,color] hover:bg-ink/[0.05] hover:text-foreground"
      >
        <LogOut size={16} strokeWidth={2.25} aria-hidden="true" />
        <span className="hidden sm:inline">Sign out</span>
        <span className="sr-only sm:hidden">Sign out</span>
      </button>
    </header>
  );
}
