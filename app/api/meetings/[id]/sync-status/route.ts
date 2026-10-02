import { NextResponse } from "next/server";
import { fetchBaasBotSnapshot } from "@/lib/meeting-baas/client";
import { statusFromBaasCode } from "@/lib/meeting-baas/status";
import { createClient, getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeMeeting } from "@/lib/meeting-baas/finalize";
import type { MeetingStatus } from "@/types/database";

export const maxDuration = 60;

/** Reconcile an owned meeting with Meeting BaaS if a lifecycle webhook was missed. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id,bot_id,status,started_at,ended_at,duration_seconds,transcript_status,summary_status")
    .eq("id", id)
    .single();
  if (meetingError || !meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!meeting.bot_id) {
    return NextResponse.json({ status: meeting.status, changed: false });
  }

  let bot;
  try {
    bot = await fetchBaasBotSnapshot(meeting.bot_id);
  } catch (error) {
    console.error("Meeting BaaS status reconciliation failed", {
      meetingId: id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Could not refresh bot status." }, { status: 502 });
  }

  // The provider's completed state is terminal. If it has no transcript
  // artifact, complete cleanly with an explicit no-transcript state.
  const nextStatus: MeetingStatus | null =
    bot.status === "completed" ? "processing" : statusFromBaasCode(bot.status);
  if (!nextStatus) {
    return NextResponse.json({ status: meeting.status, providerStatus: bot.status, changed: false });
  }

  const update: {
    status?: MeetingStatus;
    started_at?: string;
    ended_at?: string;
    duration_seconds?: number;
    transcript_status?: string;
    summary_status?: string;
  } = {};
  if (meeting.status !== nextStatus) update.status = nextStatus;
  if (!meeting.started_at && bot.joined_at) update.started_at = bot.joined_at;
  if (!meeting.ended_at && bot.exited_at) update.ended_at = bot.exited_at;
  if (
    (meeting.duration_seconds == null || meeting.duration_seconds === 0) &&
    typeof bot.duration_seconds === "number"
  ) {
    update.duration_seconds = bot.duration_seconds;
  }
  if (bot.status === "completed") {
    if (meeting.status !== "processing" && meeting.status !== "completed") {
      update.status = "processing";
    }
    if (!meeting.ended_at) update.ended_at = bot.exited_at ?? new Date().toISOString();
    if (meeting.transcript_status !== "received") update.transcript_status = "received";
  }

  if (Object.keys(update).length > 0) {
    const { error: updateError } = await supabase.from("meetings").update(update).eq("id", id);
    if (updateError) {
      console.error("Could not persist reconciled Meeting BaaS status", {
        meetingId: id,
        providerStatus: bot.status,
        error: updateError.message,
      });
      return NextResponse.json({ error: "Could not save bot status." }, { status: 500 });
    }
  }

  if (bot.status !== "completed") {
    return NextResponse.json({ status: nextStatus, providerStatus: bot.status, changed: Object.keys(update).length > 0 });
  }

  const admin = createAdminClient();
  const artifactUrl = typeof bot.transcription === "string" ? bot.transcription : undefined;
  const rawArtifactUrl = typeof bot.raw_transcription === "string" ? bot.raw_transcription : undefined;
  let finalized;
  try {
    finalized = await finalizeMeeting(admin, id, meeting.bot_id, artifactUrl, rawArtifactUrl);
  } catch (error) {
    console.error("Meeting BaaS completion reconciliation failed", {
      meetingId: id,
      hasArtifact: Boolean(artifactUrl),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // The provider artifact can expire or fail to download. A live transcript
    // is still useful, so finish from persisted live segments when available.
    const { count, error: countError } = await admin
      .from("transcript_segments")
      .select("id", { count: "exact", head: true })
      .eq("meeting_id", id);
    if (countError) return NextResponse.json({ error: "Could not inspect saved transcript." }, { status: 500 });
    if ((count ?? 0) > 0) {
      try {
        finalized = await finalizeMeeting(admin, id, meeting.bot_id);
      } catch (fallbackError) {
        console.error("Could not finalize saved live transcript", {
          meetingId: id,
          error: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
        });
      }
    }

    if (!finalized) {
      const { error: finishError } = await admin
        .from("meetings")
        .update({
          status: "completed",
          transcript_status: "unavailable",
          summary_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (finishError) return NextResponse.json({ error: "Could not save final meeting state." }, { status: 500 });
      return NextResponse.json({ status: "completed", providerStatus: bot.status, changed: true });
    }
  }

  return NextResponse.json({
    status: finalized.claimed ? "completed" : meeting.status,
    providerStatus: bot.status,
    changed: Boolean(finalized.claimed) || Object.keys(update).length > 0,
  });
}
