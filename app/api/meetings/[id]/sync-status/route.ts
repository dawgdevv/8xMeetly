import { NextResponse } from "next/server";
import { fetchBaasBotSnapshot } from "@/lib/meeting-baas/client";
import { statusFromBaasCode } from "@/lib/meeting-baas/status";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { MeetingStatus } from "@/types/database";

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
    bot.status === "completed" && !bot.transcription
      ? "completed"
      : statusFromBaasCode(bot.status);
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
  if (bot.status === "completed" && !bot.transcription) {
    if (meeting.transcript_status !== "unavailable") update.transcript_status = "unavailable";
    if (meeting.summary_status !== "no_transcript") update.summary_status = "no_transcript";
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ status: meeting.status, providerStatus: bot.status, changed: false });
  }

  const { error: updateError } = await supabase
    .from("meetings")
    .update(update)
    .eq("id", id);
  if (updateError) {
    console.error("Could not persist reconciled Meeting BaaS status", {
      meetingId: id,
      providerStatus: bot.status,
      error: updateError.message,
    });
    return NextResponse.json({ error: "Could not save bot status." }, { status: 500 });
  }

  return NextResponse.json({ status: nextStatus, providerStatus: bot.status, changed: true });
}
