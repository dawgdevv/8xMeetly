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
    <aside className="hidden w-[248px] shrink-0 flex-col rounded-[26px] border border-border/90 bg-card p-4 shadow-[0_8px_28px_-22px_rgb(41_39_33/0.32)] md:flex lg:w-[264px] lg:p-5">
      <Link
        href="/dashboard"
        aria-label="8xMeetly dashboard home"
        className="px-2 pb-2 pt-1"
      >
        <Logo />
      </Link>
      <nav aria-label="Primary" className="mt-7 flex-1 space-y-1.5">
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
                "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-[background-color,color,transform]",
                active
                  ? "bg-primary/[0.09] text-primary"
                  : "text-stone-500 hover:bg-stone-100 hover:text-ink"
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
        className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-3 text-sm font-bold text-white shadow-[0_7px_14px_-9px_rgb(128_42_25/0.7)] transition-[background-color,transform,box-shadow] hover:bg-primary-dark hover:shadow-[0_9px_18px_-9px_rgb(128_42_25/0.65)] active:scale-[0.98]"
      >
        <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
        New Meeting
      </Link>
    </aside>
  );
}
