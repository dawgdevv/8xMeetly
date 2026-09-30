import Link from "next/link";
import { ArrowLeft, FileText, MessageCircleQuestion, PanelsTopLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils/meetings";
import { formatMeetingDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: PanelsTopLeft },
  { id: "transcript", label: "Transcript", icon: FileText },
  { id: "ask", label: "Ask AI", icon: MessageCircleQuestion },
] as const;

export function WorkspaceHeader({
  meetingId,
  title,
  status,
  createdAt,
  durationSeconds,
  activeTab,
  transcriptCount,
}: {
  meetingId: string;
  title: string;
  status: string;
  createdAt: string;
  durationSeconds: number | null;
  activeTab: (typeof TABS)[number]["id"];
  transcriptCount?: number;
}) {
  return (
    <>
      <Link
        href="/dashboard/meetings"
        className="inline-flex min-h-9 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-muted transition-[background-color,color] hover:bg-ink/[0.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card">
          <ArrowLeft size={15} aria-hidden="true" />
        </span>
        All meetings
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-balance text-[27px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{formatMeetingDate(createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatDuration(durationSeconds)}</span>
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      <nav
        aria-label="Meeting sections"
        className="mt-6 grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const current = id === activeTab;
          const countLabel = id === "transcript" && typeof transcriptCount === "number"
            ? transcriptCount.toLocaleString()
            : null;
          return (
            <Link
              key={id}
              href={`/dashboard/meetings/${meetingId}${id === "overview" ? "" : `/${id === "ask" ? "ask" : id}`}`}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-bold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:px-4",
                current
                  ? "bg-ink text-white shadow-sm"
                  : "text-muted hover:bg-ink/[0.05] hover:text-ink"
              )}
            >
              <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
              <span className="truncate">{label}</span>
              {countLabel !== null && (
                <span className={cn(
                  "hidden min-w-5 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums sm:inline-flex sm:justify-center",
                  current ? "bg-white/15 text-white" : "bg-ink/[0.06] text-muted"
                )}>
                  {countLabel}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
