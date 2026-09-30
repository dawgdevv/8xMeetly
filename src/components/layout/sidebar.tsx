"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Settings, Video } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meetings", href: "/dashboard/meetings", icon: Video },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col rounded-3xl border border-border bg-card p-4 shadow-[0_2px_16px_-8px_rgb(35_42_104/0.15)] md:flex">
      <Link
        href="/dashboard"
        aria-label="8xMeetly dashboard home"
        className="px-2 pb-2 pt-1"
      >
        <Logo />
      </Link>
      <nav aria-label="Primary" className="mt-4 flex-1 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-[background-color,color]",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-stone-500 hover:bg-black/5 hover:text-foreground"
              )}
            >
              <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard/meetings/new"
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-primary px-3.5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(206_68_24/0.6)] transition-[background-color,transform] hover:bg-[#b53b14] active:scale-[0.98]"
      >
        <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
        New Meeting
      </Link>
    </aside>
  );
}
