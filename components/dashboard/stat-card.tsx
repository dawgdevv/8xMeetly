import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <Card className="flex items-center gap-3.5 p-4 sm:p-5">
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint}`}
      >
        <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-muted">
          {label}
        </span>
        <span className="block text-2xl font-extrabold tabular-nums tracking-tight text-ink">
          {value}
        </span>
      </span>
    </Card>
  );
}
