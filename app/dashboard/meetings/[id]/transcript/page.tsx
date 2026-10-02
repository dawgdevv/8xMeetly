import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleAlert, FileText, LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LiveRefresher } from "@/components/meetings/live-refresher";
import { WorkspaceHeader } from "@/components/meetings/workspace-header";
import { TranscriptSearch } from "@/components/transcript/transcript-search";
import { createClient } from "@/lib/supabase/server";

type MeetingState = {
  title: string | null;
  status: string;
  duration_seconds: number | null;
  transcript_status: string | null;
  created_at: string;
};

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let meeting: MeetingState | null = null;
  let segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null; is_final: boolean }> = [];
  let transcriptCount = 0;

  try {
    const supabase = await createClient();
    const { data: m } = await supabase
      .from("meetings")
      .select("title,status,duration_seconds,transcript_status,created_at")
      .eq("id", id)
      .single();
    if (!m) notFound();
    const status = String(m.status);
    const isTerminal = status === "completed" || status === "failed";
    const [{ data: seg }, { count }] = await Promise.all([
      supabase
        .from("transcript_segments")
        .select("id,speaker,text,start_time,is_final")
        .eq("meeting_id", id)
        .order("start_time", { ascending: isTerminal })
        .limit(1000),
      supabase
        .from("transcript_segments")
        .select("id", { count: "exact", head: true })
        .eq("meeting_id", id),
    ]);
    meeting = {
      title: (m.title as string | null) ?? null,
      status,
      duration_seconds: (m.duration_seconds as number | null) ?? null,
      transcript_status: (m.transcript_status as string | null) ?? null,
      created_at: String(m.created_at),
    };
    segments = (seg ?? []) as typeof segments;
    transcriptCount = count ?? segments.length;
  } catch {
    notFound();
  }
  if (!meeting) notFound();

  const terminal = meeting.status === "completed" || meeting.status === "failed";
  const transcriptUnavailable = meeting.transcript_status === "unavailable";

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <LiveRefresher meetingId={id} active={!terminal} />
      <WorkspaceHeader
        meetingId={id}
        title={meeting.title ?? "Untitled meeting"}
        status={meeting.status}
        createdAt={meeting.created_at}
        durationSeconds={meeting.duration_seconds}
        activeTab="transcript"
        transcriptCount={transcriptCount}
      />

      <div className="mb-4 mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">Meeting transcript</h2>
          <p className="mt-1 text-sm text-muted">
            {transcriptCount > 0
              ? terminal
                ? "Search the conversation or scan it from the beginning."
                : "Live transcript · newest lines first. Search to find a specific detail."
              : "The conversation will appear here when it’s ready."}
          </p>
        </div>
        {transcriptCount > 0 && (
          <span className="rounded-full bg-card px-3 py-1.5 text-xs font-bold tabular-nums text-muted ring-1 ring-border">
            {transcriptCount.toLocaleString()} segments
          </span>
        )}
      </div>

      {segments.length > 0 ? (
        <TranscriptSearch segments={segments} />
      ) : meeting.status === "failed" ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <CircleAlert size={24} />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-ink">No transcript was captured</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            The bot couldn’t complete this meeting, so there’s no conversation to show. Check the Meet link and try again.
          </p>
          <Link
            href="/dashboard/meetings/new"
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start another meeting <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Card>
      ) : meeting.status === "completed" ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <FileText size={24} />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-ink">
            {transcriptUnavailable ? "Transcript unavailable" : "No transcript was saved"}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {transcriptUnavailable
              ? "The bot left the meeting, but the recording service didn’t return a transcript. New meetings request transcription automatically."
              : "This meeting has finished, but no transcript is attached. You can still review its overview or start a new recording."}
          </p>
          <Link
            href={`/dashboard/meetings/${id}`}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-ink transition-[background-color,border-color] hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Back to overview <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Card>
      ) : (
        <Card className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.09] text-primary">
            <LoaderCircle size={24} className="motion-safe:animate-spin" />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-ink">
            {meeting.status === "joining" || meeting.status === "scheduled"
              ? "Waiting for the bot to join"
              : meeting.status === "in_meeting" || meeting.status === "in_progress"
                ? "Your meeting is being captured"
                : "Transcript processing"}
          </h3>
          <p aria-live="polite" className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            This view updates automatically. The transcript will appear here as soon as it’s ready.
          </p>
        </Card>
      )}
    </div>
  );
}
