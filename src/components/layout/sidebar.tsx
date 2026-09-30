import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Meetings", href: "/dashboard/meetings", icon: "🎙️" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <a href="/dashboard" className="text-xl font-bold text-primary">Meetly AI</a>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              "text-muted hover:text-foreground hover:bg-background"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <Link
          href="/dashboard/meetings/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Meeting
        </Link>
      </div>
    </aside>
  );
}
