import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Circle,
  CircleAlert,
  ListChecks,
  LoaderCircle,
  Radio,
  Sparkles,
  Tags,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LiveRefresher } from "@/components/meetings/live-refresher";
import { WorkspaceHeader } from "@/components/meetings/workspace-header";
import { createClient } from "@/lib/supabase/server";
import { formatMeetingTitle } from "@/lib/utils/format";
import { formatTimestamp } from "@/lib/utils/meetings";
import { cn } from "@/lib/utils";

function groupInsights(insights: Array<{ type: string; content: string }>) {
  return {
    summary: insights.find((i) => i.type === "summary")?.content ?? null,
    topics: insights.filter((i) => i.type === "key_topic").map((i) => i.content),
    decisions: insights.filter((i) => i.type === "decision").map((i) => i.content),
    actions: insights.filter((i) => i.type === "action_item").map((i) => i.content),
  };
}

const STEPS = ["Connecting", "Joined", "Recording", "Processing", "Complete"] as const;

function stepIndex(status: string): number {
  switch (status) {
    case "scheduled":
    case "joining":
      return 0;
    case "in_meeting":
      return 1;
    case "in_progress":
      return 2;
    case "processing":
      return 3;
    case "completed":
      return 4;
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
    <Card className="p-5 sm:p-7">
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
    transcript_status: string | null;
    summary_status: string | null;
    created_at: string;
  } | null = null;
  let insights: Array<{ type: string; content: string }> = [];
  let segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null; is_final: boolean }> = [];
  let transcriptCount = 0;

  try {
    const supabase = await createClient();
    const { data: m } = await supabase
      .from("meetings")
      .select("id,title,status,duration_seconds,transcript_status,summary_status,created_at")
      .eq("id", id)
      .single();
    if (!m) notFound();
    meeting = {
      id: String(m.id),
      title: (m.title as string | null) ?? null,
      status: String(m.status),
      duration_seconds: (m.duration_seconds as number | null) ?? null,
      transcript_status: (m.transcript_status as string | null) ?? null,
      summary_status: (m.summary_status as string | null) ?? null,
      created_at: String(m.created_at),
    };
    const [{ data: ins }, { data: seg }, { count }] = await Promise.all([
      supabase.from("meeting_insights").select("type,content").eq("meeting_id", id),
      supabase
        .from("transcript_segments")
        .select("id,speaker,text,start_time,is_final")
        .eq("meeting_id", id)
        .order("start_time", { ascending: m.status === "completed" })
        .limit(200),
      supabase
        .from("transcript_segments")
        .select("id", { count: "exact", head: true })
        .eq("meeting_id", id),
    ]);
    insights = (ins ?? []) as typeof insights;
    segments = (seg ?? []) as typeof segments;
    transcriptCount = count ?? segments.length;
  } catch {
    notFound();
  }

  if (!meeting) notFound();
  const grouped = groupInsights(insights);
  const idx = stepIndex(meeting.status);
  const done = meeting.status === "completed";

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <LiveRefresher meetingId={id} active={!done && meeting.status !== "failed"} />
      <WorkspaceHeader
        meetingId={id}
        title={formatMeetingTitle(meeting.title, meeting.created_at)}
        status={meeting.status}
        createdAt={meeting.created_at}
        durationSeconds={meeting.duration_seconds}
        activeTab="overview"
        transcriptCount={transcriptCount}
      />

      {meeting.status === "failed" ? (
        <Card className="mt-5 flex flex-col items-start gap-4 border-red-200 bg-red-50/60 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <CircleAlert size={19} />
            </span>
            <div>
              <h2 className="font-extrabold text-ink">The bot couldn’t complete this meeting</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">
                It may have been blocked from joining or removed from the call. Check the Meet link and try again.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/meetings/new"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start another meeting <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Card>
      ) : !done ? (
        <div className="mt-4 space-y-4">
        <Card className="p-6 sm:p-7">
          <p className="flex items-center gap-2.5 font-bold text-ink">
            {meeting.status === "scheduled" ? (
              <>
                <LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin text-primary" />
                Your meeting is queued to start…
              </>
            ) : meeting.status === "processing" ? (
              <>
                <LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin text-primary" />
                {segments.length > 0
                  ? "Transcript captured. Preparing your notes…"
                  : "Preparing your transcript and notes…"}
              </>
            ) : meeting.status === "in_meeting" ? (
              <>
                <CheckCircle2 size={18} aria-hidden="true" className="text-sky-700" />
                The bot has joined and is getting ready to record.
              </>
            ) : meeting.status === "in_progress" ? (
              <>
                <Radio size={18} aria-hidden="true" className="text-primary" />
                Recording your meeting.
              </>
            ) : (
              <>
                <LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin text-primary" />
                The bot is joining your meeting…
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
                      current && (meeting.status === "in_meeting" ? "bg-sky-100 text-sky-700" : "bg-primary/10 text-primary"),
                      !reached && !current && "bg-ink/[0.06] text-stone-400"
                    )}
                  >
                    {reached ? (
                      <Check size={15} strokeWidth={3} />
                    ) : current && (meeting.status === "scheduled" || meeting.status === "joining" || meeting.status === "processing") ? (
                      <LoaderCircle size={15} strokeWidth={2.5} className="motion-safe:animate-spin" />
                    ) : current && meeting.status === "in_progress" ? (
                      <Radio size={15} strokeWidth={2.5} />
                    ) : (
                      <Circle size={13} />
                    )}
                  </span>
                  <span className={reached || current ? "text-ink" : "text-stone-400"}>
                    {i === 1 && meeting.status === "in_meeting" ? "In meeting" : s}
                  </span>
                </li>
              );
            })}
          </ol>
          <p aria-live="polite" className="mt-5 text-[13px] text-muted">
            We’ll update this page as the meeting progresses.
          </p>
        </Card>
        {meeting.status === "processing" && segments.length > 0 && (
          <Section icon={ListChecks} title="Transcript so far">
            <div className="space-y-4">
              {segments.slice(0, 5).map((s) => (
                <div key={s.id} className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-semibold tabular-nums text-muted">
                    {formatTimestamp(s.start_time)} · {s.speaker ?? "Speaker"}
                    {!s.is_final && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary">Interim</span>}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-stone-600">{s.text}</p>
                </div>
              ))}
            </div>
            <Link
              href={`/dashboard/meetings/${id}/transcript`}
              className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Open live transcript <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </Section>
        )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {meeting.transcript_status === "unavailable" && segments.length === 0 && (
            <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/70 p-5 sm:p-6">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <FileText size={18} />
              </span>
              <div>
                <h2 className="font-bold text-ink">Meeting complete, transcript unavailable</h2>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  The bot left the meeting, but the recording service did not return a transcript. New meetings will request transcription automatically.
                </p>
              </div>
            </Card>
          )}
          {meeting.transcript_status !== "unavailable" &&
            !grouped.summary && grouped.topics.length === 0 && grouped.decisions.length === 0 &&
            grouped.actions.length === 0 && segments.length === 0 && (
              <Card className="p-6 sm:p-7">
                <h2 className="font-extrabold text-ink">Your meeting is complete</h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                  No transcript or notes were saved for this call. Start another meeting to capture the conversation and its action items.
                </p>
              </Card>
            )}
          {segments.length > 0 &&
            !grouped.summary && grouped.topics.length === 0 && grouped.decisions.length === 0 &&
            grouped.actions.length === 0 && (
              <Card className="flex flex-col items-start justify-between gap-4 bg-background/60 p-5 sm:flex-row sm:items-center sm:p-6">
                <div>
                  <h2 className="font-extrabold text-ink">Your transcript is ready</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {meeting.summary_status === "failed"
                      ? "The transcript is ready, but note generation failed. You can still read the conversation or ask a question about it."
                      : meeting.summary_status === "unavailable"
                        ? "The transcript is ready, but AI notes aren’t configured yet. You can still read the conversation or ask a question about it."
                        : "Meeting notes aren’t available for this call yet. You can read the conversation or ask a question about it."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/dashboard/meetings/${id}/transcript`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-ink transition-[background-color,border-color] hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Read transcript
                  </Link>
                  <Link
                    href={`/dashboard/meetings/${id}/ask`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition-[background-color] hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Ask AI
                  </Link>
                </div>
              </Card>
            )}
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
                    <p className="flex items-center gap-2 text-xs font-semibold tabular-nums text-muted">
                      {formatTimestamp(s.start_time)} · {s.speaker ?? "Speaker"}
                      {!s.is_final && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary">Interim</span>}
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
