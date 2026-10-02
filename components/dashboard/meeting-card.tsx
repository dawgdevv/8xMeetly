import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils/meetings";
import { formatMeetingDate, formatMeetingTitle } from "@/lib/utils/format";

export function MeetingCard({
  id,
  title,
  status,
  durationSeconds,
  createdAt,
  actionCount,
}: {
  id: string;
  title: string | null;
  status: string;
  durationSeconds: number | null;
  createdAt: string;
  actionCount?: number;
}) {
  const displayTitle = formatMeetingTitle(title, createdAt);

  return (
    <Link
      href={`/dashboard/meetings/${id}`}
      className="group block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex min-h-[76px] items-center gap-3 p-4 transition-[border-color,box-shadow,transform] group-hover:-translate-y-px group-hover:border-primary/35 group-hover:shadow-[0_12px_28px_-16px_rgb(41_39_33/0.32)] sm:gap-4 sm:p-5">
        <span
          aria-hidden="true"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-ink/[0.06] text-ink sm:flex"
        >
          <span className="text-sm font-extrabold">
            {displayTitle.charAt(0).toUpperCase()}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-ink">
            {displayTitle}
          </span>
            <span className="mt-1 block truncate text-[13px] font-medium text-muted">
            {formatMeetingDate(createdAt)} · {formatDuration(durationSeconds)}
            {typeof actionCount === "number" && actionCount > 0
              ? ` · ${actionCount} action ${actionCount === 1 ? "item" : "items"}`
              : ""}
          </span>
        </span>
        <StatusBadge status={status} />
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="hidden shrink-0 text-stone-300 sm:block"
        />
      </Card>
    </Link>
  );
}
