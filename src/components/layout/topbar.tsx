"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
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
    <header className="flex items-center gap-3 rounded-3xl border border-border bg-card/80 py-3 pl-4 pr-3 shadow-[0_2px_16px_-8px_rgb(27_37_96/0.15)] backdrop-blur md:py-2.5">
      <Link href="/dashboard" aria-label="8xMeetly dashboard home" className="md:hidden">
        <Logo />
      </Link>
      <div className="flex-1" />
      <Link
        href="/dashboard/meetings/new"
        className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-ink/90 active:scale-[0.98] md:hidden"
      >
        <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
        New
      </Link>
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
