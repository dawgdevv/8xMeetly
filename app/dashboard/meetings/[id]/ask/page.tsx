import { notFound } from "next/navigation";
import { ArrowRight, CircleAlert, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LiveRefresher } from "@/components/meetings/live-refresher";
import { WorkspaceHeader } from "@/components/meetings/workspace-header";
import { AskPanel } from "@/components/meetings/ask-panel";
import { createClient } from "@/lib/supabase/server";

export default async function AskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: meeting }, { count: transcriptCount }] = await Promise.all([
    supabase
      .from("meetings")
      .select("title,status,duration_seconds,transcript_status,created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("transcript_segments")
      .select("id", { count: "exact", head: true })
      .eq("meeting_id", id),
  ]);
  if (!meeting) notFound();

  const status = String(meeting.status);
  const hasTranscript = (transcriptCount ?? 0) > 0;
  const terminal = status === "completed" || status === "failed";

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <LiveRefresher meetingId={id} active={!terminal} />
      <WorkspaceHeader
        meetingId={id}
        title={(meeting.title as string | null) ?? "Untitled meeting"}
        status={status}
        createdAt={String(meeting.created_at)}
        durationSeconds={(meeting.duration_seconds as number | null) ?? null}
        activeTab="ask"
        transcriptCount={transcriptCount ?? 0}
      />

      <div className="mb-4 mt-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Meeting assistant</p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink">Ask about this conversation</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Get a grounded answer from what was actually said in the meeting.
        </p>
      </div>

      {hasTranscript ? (
        <AskPanel meetingId={id} />
      ) : status === "failed" ? (
        <Card className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <CircleAlert size={24} />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-ink">There’s no transcript to ask about</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            The bot couldn’t complete this meeting. Check the Meet link and start another meeting to capture its conversation.
          </p>
          <Link
            href="/dashboard/meetings/new"
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start another meeting <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Card>
      ) : status === "completed" ? (
        <Card className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <MessageCircleQuestion size={24} />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-ink">This meeting has no transcript</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {meeting.transcript_status === "unavailable"
              ? "The recording service didn’t return a transcript, so the assistant has no meeting content to reference."
              : "The transcript wasn’t saved, so the assistant has no meeting content to reference."}
          </p>
          <Link
            href={`/dashboard/meetings/${id}/transcript`}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-ink transition-[background-color,border-color] hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            View transcript status <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Card>
      ) : (
        <Card className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.09] text-primary">
            <MessageCircleQuestion size={24} />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-ink">
            {status === "joining" || status === "scheduled"
              ? "The assistant is waiting for the meeting"
              : status === "in_meeting" || status === "in_progress"
                ? "The assistant is listening"
                : "The transcript is being prepared"}
          </h3>
          <p aria-live="polite" className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Ask AI will be ready as soon as the transcript is available. This page updates automatically.
          </p>
        </Card>
      )}
    </div>
  );
}
