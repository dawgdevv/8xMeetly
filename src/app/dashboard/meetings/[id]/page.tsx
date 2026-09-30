import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ListChecks,
  LoaderCircle,
  Sparkles,
  Tags,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatTimestamp } from "@/lib/utils/meetings";
import { formatMeetingDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

function groupInsights(insights: Array<{ type: string; content: string }>) {
  return {
    summary: insights.find((i) => i.type === "summary")?.content ?? null,
    topics: insights.filter((i) => i.type === "key_topic").map((i) => i.content),
    decisions: insights.filter((i) => i.type === "decision").map((i) => i.content),
    actions: insights.filter((i) => i.type === "action_item").map((i) => i.content),
  };
}

const STEPS = ["Connecting", "Recording", "Processing", "Complete"] as const;

function stepIndex(status: string): number {
  switch (status) {
    case "scheduled":
    case "joining":
      return 0;
    case "in_progress":
      return 1;
    case "processing":
      return 2;
    case "completed":
      return 3;
    default:
      return 0;
  }
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 sm:p-7">
      <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-ink">
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={16} strokeWidth={2.5} />
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let meeting: {
    id: string;
    title: string | null;
    status: string;
    duration_seconds: number | null;
    created_at: string;
  } | null = null;
  let insights: Array<{ type: string; content: string }> = [];
  let segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null }> = [];

  try {
    const supabase = await createClient();
    const { data: m } = await supabase
      .from("meetings")
      .select("id,title,status,duration_seconds,created_at")
      .eq("id", id)
      .single();
    if (!m) notFound();
    meeting = {
      id: String(m.id),
      title: (m.title as string | null) ?? null,
      status: String(m.status),
      duration_seconds: (m.duration_seconds as number | null) ?? null,
      created_at: String(m.created_at),
    };
    const [{ data: ins }, { data: seg }] = await Promise.all([
      supabase.from("meeting_insights").select("type,content").eq("meeting_id", id),
      supabase
        .from("transcript_segments")
        .select("id,speaker,text,start_time")
        .eq("meeting_id", id)
        .order("start_time", { ascending: true })
        .limit(200),
    ]);
    insights = (ins ?? []) as typeof insights;
    segments = (seg ?? []) as typeof segments;
  } catch {
    notFound();
  }

  if (!meeting) notFound();
  const grouped = groupInsights(insights);
  const idx = stepIndex(meeting.status);
  const done = meeting.status === "completed";

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/meetings"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
        All meetings
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
            {meeting.title ?? "Untitled meeting"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} aria-hidden="true" />
              {formatMeetingDate(meeting.created_at)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatDuration(meeting.duration_seconds)}</span>
          </p>
        </div>
        <StatusBadge status={meeting.status} />
      </div>

      <nav aria-label="Meeting sections" className="mt-5 flex gap-1 rounded-full border border-border bg-card p-1 text-sm font-semibold">
        <span aria-current="page" className="flex-1 rounded-full bg-ink px-4 py-2 text-center text-white">
          Overview
        </span>
        <Link
          href={`/dashboard/meetings/${id}/transcript`}
          className="flex-1 rounded-full px-4 py-2 text-center text-stone-500 transition-[background-color,color] hover:bg-ink/[0.05] hover:text-ink"
        >
          Transcript
        </Link>
        <Link
          href={`/dashboard/meetings/${id}/ask`}
          className="flex-1 rounded-full px-4 py-2 text-center text-stone-500 transition-[background-color,color] hover:bg-ink/[0.05] hover:text-ink"
        >
          Ask AI
        </Link>
      </nav>

      {!done ? (
        <Card className="mt-4 p-6 sm:p-7">
          <p className="flex items-center gap-2.5 font-bold text-ink">
            {meeting.status === "processing" ? (
              "Processing your meeting…"
            ) : (
              <>
                <LoaderCircle size={18} aria-hidden="true" className="animate-spin text-primary" />
                The bot is joining…
              </>
            )}
          </p>
          <ol className="mt-5 space-y-3">
            {STEPS.map((s, i) => {
              const reached = i < idx || done;
              const current = i === idx && !done;
              return (
                <li key={s} className="flex items-center gap-3 text-sm font-semibold">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full",
                      reached && "bg-green-100 text-green-700",
                      current && "bg-primary/10 text-primary",
                      !reached && !current && "bg-ink/[0.06] text-stone-400"
                    )}
                  >
                    {reached ? (
                      <Check size={15} strokeWidth={3} />
                    ) : current ? (
                      <LoaderCircle size={15} strokeWidth={2.5} className="animate-spin" />
                    ) : (
                      <Circle size={13} />
                    )}
                  </span>
                  <span className={reached || current ? "text-ink" : "text-stone-400"}>{s}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-5 text-[13px] text-muted">
            Status updates automatically when the bot reports back. Refresh the page to check.
          </p>
        </Card>
      ) : (
        <div className="mt-4 space-y-4">
          {grouped.summary && (
            <Section icon={Sparkles} title="Summary">
              <p className="text-pretty text-[15px] leading-relaxed text-stone-600">{grouped.summary}</p>
            </Section>
          )}
          {grouped.topics.length > 0 && (
            <Section icon={Tags} title="Key Topics">
              <ul className="flex flex-wrap gap-2">
                {grouped.topics.map((t, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-ink/[0.06] px-3.5 py-1.5 text-[13px] font-semibold text-ink"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {grouped.decisions.length > 0 && (
            <Section icon={CheckCircle2} title="Decisions">
              <ul className="space-y-2.5">
                {grouped.decisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] text-stone-600">
                    <CheckCircle2 size={17} strokeWidth={2.5} aria-hidden="true" className="mt-0.5 shrink-0 text-green-600" />
                    <span className="min-w-0">{d}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {grouped.actions.length > 0 && (
            <Section icon={ListChecks} title="Action Items">
              <ul className="space-y-2.5">
                {grouped.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] text-stone-600">
                    <span aria-hidden="true" className="mt-[3px] h-4 w-4 shrink-0 rounded border-2 border-stone-300" />
                    <span className="min-w-0">{a}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {segments.length > 0 && (
            <Section icon={ListChecks} title="Transcript Preview">
              <div className="space-y-4">
                {segments.slice(0, 5).map((s) => (
                  <div key={s.id} className="min-w-0">
                    <p className="text-xs font-semibold tabular-nums text-muted">
                      {formatTimestamp(s.start_time)} · {s.speaker ?? "Speaker"}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-stone-600">{s.text}</p>
                  </div>
                ))}
              </div>
              <Link
                href={`/dashboard/meetings/${id}/transcript`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                View full transcript
              </Link>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
