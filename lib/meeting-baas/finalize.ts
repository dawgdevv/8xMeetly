import type { SupabaseClient } from "@supabase/supabase-js";
import { summarizeTranscript } from "@/lib/ai/summarize";
import {
  fetchV2Transcription,
  type TranscriptSegmentLike,
} from "@/lib/meeting-baas/client";
import { providerSegmentKey } from "@/lib/meeting-baas/transcript-key";
import { normalizeTranscript } from "@/lib/utils/meetings";

const STALE_CLAIM_MS = 2 * 60 * 1000;

/** Download any final artifact, persist transcript rows, and finish notes.
 * Safe to call from both webhooks and status reconciliation. */
export async function finalizeMeeting(
  admin: SupabaseClient,
  meetingId: string,
  botId: string,
  transcriptionUrl?: string,
  rawTranscriptionUrl?: string
) {
  if (transcriptionUrl) {
    const fetched = await fetchV2Transcription(transcriptionUrl, rawTranscriptionUrl);
    const { data: liveRows, error: liveRowsError } = await admin
      .from("transcript_segments")
      .select("start_time,provider_segment_key")
      .eq("meeting_id", meetingId)
      .not("provider_segment_key", "is", null);
    if (liveRowsError) throw liveRowsError;

    const unmatchedLiveRows = [...(liveRows ?? [])];
    const rows = fetched.map((segment: TranscriptSegmentLike) => {
      let segmentKey = providerSegmentKey(botId, segment.start_time);
      if (segment.start_time !== null) {
        let closestIndex = -1;
        let closestDelta = 1.25;
        unmatchedLiveRows.forEach((live, index) => {
          if (live.start_time === null || !live.provider_segment_key) return;
          const delta = Math.abs(live.start_time - segment.start_time!);
          if (delta < closestDelta) {
            closestDelta = delta;
            closestIndex = index;
          }
        });
        if (closestIndex >= 0) {
          segmentKey = unmatchedLiveRows.splice(closestIndex, 1)[0].provider_segment_key;
        }
      }
      return {
        meeting_id: meetingId,
        speaker: segment.speaker,
        speaker_id: null,
        text: segment.text,
        start_time: segment.start_time,
        end_time: segment.end_time,
        provider_segment_key: segmentKey,
        is_final: true,
      };
    });

    if (rows.length > 0) {
      const { error } = await admin
        .from("transcript_segments")
        .upsert(rows, { onConflict: "provider_segment_key" });
      if (error) throw error;
    }
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS).toISOString();
  const { data: claim, error: claimError } = await admin
    .from("meetings")
    .update({ summary_status: "running", updated_at: now.toISOString() })
    .eq("id", meetingId)
    .or(`summary_status.is.null,summary_status.eq.pending,summary_status.eq.failed,summary_status.eq.running.and.updated_at.lt.${staleBefore}`)
    .select("id")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claim) return { claimed: false };

  try {
    const { data: segments, error: segmentsError } = await admin
      .from("transcript_segments")
      .select("speaker,text,start_time")
      .eq("meeting_id", meetingId)
      .order("start_time", { ascending: true });
    if (segmentsError) throw segmentsError;

    if (!segments?.length) {
      const { error } = await admin
        .from("meetings")
        .update({ status: "completed", transcript_status: "unavailable", summary_status: "no_transcript", updated_at: new Date().toISOString() })
        .eq("id", meetingId);
      if (error) throw error;
      return { claimed: true, summaryStatus: "no_transcript", transcriptCount: 0 };
    }

    if (!process.env.OPENAI_API_KEY) {
      const { error } = await admin
        .from("meetings")
        .update({ status: "completed", summary_status: "unavailable", updated_at: new Date().toISOString() })
        .eq("id", meetingId);
      if (error) throw error;
      return { claimed: true, summaryStatus: "unavailable", transcriptCount: segments.length };
    }

    const result = await summarizeTranscript(normalizeTranscript(segments));
    const insights = [
      { meeting_id: meetingId, type: "summary" as const, content: result.summary },
      ...result.topics.map((content) => ({ meeting_id: meetingId, type: "key_topic" as const, content })),
      ...result.decisions.map((content) => ({ meeting_id: meetingId, type: "decision" as const, content })),
      ...result.action_items.map((action) => ({
        meeting_id: meetingId,
        type: "action_item" as const,
        content: action.description,
        metadata: { assignee: action.assignee ?? null, due_date: action.due_date ?? null },
      })),
    ];
    const { error: deleteError } = await admin.from("meeting_insights").delete().eq("meeting_id", meetingId);
    if (deleteError) throw deleteError;
    const { error: insertError } = await admin.from("meeting_insights").insert(insights);
    if (insertError) throw insertError;
    const { error: completeError } = await admin
      .from("meetings")
      .update({ status: "completed", summary_status: "done", updated_at: new Date().toISOString() })
      .eq("id", meetingId);
    if (completeError) throw completeError;
    return { claimed: true, summaryStatus: "done", transcriptCount: segments.length };
  } catch (error) {
    await admin
      .from("meetings")
      .update({ status: "completed", summary_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", meetingId);
    throw error;
  }
}
