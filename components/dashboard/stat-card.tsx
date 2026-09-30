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
    <Card className="flex min-h-[104px] items-center gap-3.5 p-4 sm:gap-4 sm:p-5">
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] ${tint}`}
      >
        <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-muted">
          {label}
        </span>
        <span className="mt-0.5 block text-[26px] font-extrabold tabular-nums leading-none tracking-tight text-ink">
          {value}
        </span>
      </span>
    </Card>
  );
}
