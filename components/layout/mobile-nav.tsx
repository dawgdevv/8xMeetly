"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Settings, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const tab = (href: string, label: string, Icon: typeof Video) => (
    <Link
      key={href}
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-[background-color,color]",
        isActive(href) ? "text-primary" : "text-stone-500 hover:text-ink"
      )}
    >
      <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
      {label}
    </Link>
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-3 z-40 md:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1 rounded-[22px] border border-border/90 bg-card/95 px-3 py-2 shadow-[0_16px_40px_-16px_rgb(41_39_33/0.4)] backdrop-blur">
        {tab("/dashboard", "Home", LayoutDashboard)}
        {tab("/dashboard/meetings", "Meetings", Video)}
        <Link
          href="/dashboard/meetings/new"
          aria-label="Start a new meeting"
          className="mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_10px_-6px_rgb(64_48_36/0.41)] transition-[background-color,transform] hover:bg-primary-dark active:scale-95"
        >
          <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
        </Link>
        {tab("/dashboard/settings", "Settings", Settings)}
      </div>
    </nav>
  );
}
