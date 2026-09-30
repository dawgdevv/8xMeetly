"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <header className="h-16 border-b border-border flex items-center justify-between px-6">
      <div className="md:hidden">
        <a href="/dashboard" className="text-xl font-bold text-primary">Meetly AI</a>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
          M
        </div>
      </div>
    </header>
  );
}
