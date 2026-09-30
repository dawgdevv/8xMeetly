import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractBotId,
  fetchV2Transcription,
  segmentEnd,
  segmentStart,
  segmentText,
  type BaasWebhookPayload,
  type TranscriptSegmentLike,
} from "@/lib/meeting-baas/client";
import { normalizeTranscript } from "@/lib/utils/meetings";
import { summarizeTranscript } from "@/lib/ai/summarize";
import { statusFromBaasCode } from "@/lib/meeting-baas/status";

// POST /api/webhooks/meeting-baas
// Meeting BaaS v2 contract (docs.meetingbaas.com):
//   `bot.status_change` → live lifecycle (status.code); SVIX-signed, account-level
//   `bot.completed`     → artifacts ready: fetch data.transcription URL (4h presigned)
//   `bot.failed`        → terminal failure
// v1 `complete`/`failed`/`transcription_complete` kept as fallback.
// Always answer fast; SVIX retries failed deliveries.

async function runAiPipeline(
  admin: ReturnType<typeof createAdminClient>,
  meetingId: string
) {
  const { data: segments } = await admin
    .from("transcript_segments")
    .select("speaker,text,start_time")
    .eq("meeting_id", meetingId)
    .order("start_time", { ascending: true });

  if (!segments || segments.length === 0) {
    await admin
      .from("meetings")
      .update({ status: "completed", summary_status: "no_transcript" })
      .eq("id", meetingId);
    return;
  }

  if (!process.env.OPENAI_API_KEY) return; // stays `processing` until key set

  const transcript = normalizeTranscript(segments);
  const result = await summarizeTranscript(transcript);
  const insights = [
    { meeting_id: meetingId, type: "summary" as const, content: result.summary },
    ...result.topics.map((t) => ({
      meeting_id: meetingId,
      type: "key_topic" as const,
      content: t,
    })),
    ...result.decisions.map((d) => ({
      meeting_id: meetingId,
      type: "decision" as const,
      content: d,
    })),
    ...result.action_items.map((a) => ({
      meeting_id: meetingId,
      type: "action_item" as const,
      content: a.description,
      metadata: { assignee: a.assignee ?? null, due_date: a.due_date ?? null },
    })),
  ];
  await admin.from("meeting_insights").insert(insights);
  await admin
    .from("meetings")
    .update({ status: "completed", summary_status: "done" })
    .eq("id", meetingId);
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // v2 account webhooks are SVIX-signed. Verify when the endpoint secret is
  // configured AND svix headers are present; otherwise fall back to the
  // bot_id lookup below (bot IDs are unguessable UUIDs).
  const svixSecret = process.env.MEETING_BAAS_WEBHOOK_SECRET ?? "";
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (svixSecret && svixId && svixTimestamp && svixSignature) {
    try {
      new Webhook(svixSecret).verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = ((): BaasWebhookPayload | null => {
    try {
      return JSON.parse(rawBody) as BaasWebhookPayload;
    } catch {
      return null;
    }
  })();
  if (!payload?.event || typeof payload.event !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const botId = extractBotId(payload);
  if (!botId) return NextResponse.json({ error: "Missing bot_id" }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: meeting } = await admin
    .from("meetings")
    .select("id,status")
    .eq("bot_id", botId)
    .single();

  if (!meeting) {
    console.warn("Meeting BaaS webhook references an unknown bot", { botId, event: payload.event });
    return NextResponse.json({ error: "Unknown bot" }, { status: 404 });
  }

  const event = payload.event;
  const data = payload.data ?? {};
  const meetingId = (meeting as { id: string; status: string }).id;
  const currentStatus = (meeting as { id: string; status: string }).status;

  // --- v2: live lifecycle ---
  if (event === "bot.status_change") {
    const code = data.status?.code;
    if (!code) return NextResponse.json({ ok: true, ignored: "no-code" });
    const mapped = statusFromBaasCode(code);
    if (!mapped) {
      console.warn("Unhandled Meeting BaaS bot status", { botId, code });
      return NextResponse.json({ ok: true, ignored: code });
    }
    if (code === "completed" && currentStatus === "completed") {
      return NextResponse.json({ ok: true });
    }
    const update: Record<string, string> = { status: mapped };
    if (data.status?.start_time && code === "in_call_recording") {
      update.started_at = new Date(data.status.start_time * 1000).toISOString();
    }
    if (data.status?.error_message) {
      console.error(`Bot ${code}:`, data.status.error_message);
    }
    const { error: updateError } = await admin
      .from("meetings")
      .update(update)
      .eq("id", meetingId);
    if (updateError) {
      console.error("Could not persist Meeting BaaS bot status", {
        botId,
        code,
        status: mapped,
        error: updateError.message,
      });
      return NextResponse.json({ error: "Could not persist bot status" }, { status: 500 });
    }
    console.info("Updated meeting status from Meeting BaaS webhook", {
      botId,
      code,
      from: currentStatus,
      to: mapped,
    });
    return NextResponse.json({ ok: true, status: mapped });
  }

  // --- v2: terminal failure ---
  if (event === "bot.failed" || event === "failed") {
    console.error("Meeting BaaS bot failed:", data.error ?? data.message ?? data);
    const { error } = await admin
      .from("meetings")
      .update({ status: "failed" })
      .eq("id", meetingId);
    if (error) {
      console.error("Could not persist failed Meeting BaaS bot", { botId, error: error.message });
      return NextResponse.json({ error: "Could not persist bot failure" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // --- v1 fallback: retranscription notice ---
  if (event === "transcription_complete") {
    await admin
      .from("meetings")
      .update({ transcript_status: "received" })
      .eq("id", meetingId);
    return NextResponse.json({ ok: true });
  }

  // --- v2: completion with artifact URLs ---
  if (event === "bot.completed") {
    // NOTE: artifact URLs are presigned for 4h — download for permanence (V2).
    const { error: completionError } = await admin
      .from("meetings")
      .update({
        status: "processing",
        ended_at: new Date().toISOString(),
        recording_url: typeof data.mp4 === "string" ? data.mp4 : null,
        duration_seconds:
          typeof data.duration_seconds === "number" ? data.duration_seconds : null,
        transcript_status: "received",
      })
      .eq("id", meetingId);
    if (completionError) {
      console.error("Could not persist completed Meeting BaaS bot", {
        botId,
        error: completionError.message,
      });
      return NextResponse.json({ error: "Could not persist bot completion" }, { status: 500 });
    }

    if (typeof data.transcription === "string" && data.transcription.length > 0) {
      try {
        const fetched = await fetchV2Transcription(data.transcription);
        const rows = fetched.map((s: TranscriptSegmentLike) => ({
          meeting_id: meetingId,
          speaker: s.speaker,
          speaker_id: null,
          text: s.text,
          start_time: s.start_time,
          end_time: s.end_time,
        }));
        if (rows.length > 0) {
          await admin.from("transcript_segments").insert(rows);
        }
      } catch (e) {
        console.error("Transcription download failed:", e);
      }
    }

    try {
      await runAiPipeline(admin, meetingId);
    } catch (e) {
      console.error("AI processing failed:", e);
    }
    return NextResponse.json({ ok: true });
  }

  // --- v1 fallback: inline transcript ---
  if (event === "complete") {
    await admin
      .from("meetings")
      .update({
        status: "processing",
        ended_at: new Date().toISOString(),
        recording_url: typeof data.mp4 === "string" ? data.mp4 : null,
        transcript_status: "received",
      })
      .eq("id", meetingId);

    const rawSegments = Array.isArray(data.transcript) ? data.transcript : [];
    const rows = rawSegments
      .map((s) => ({
        meeting_id: meetingId,
        speaker: s.speaker ?? null,
        speaker_id: null,
        text: segmentText(s),
        start_time: segmentStart(s),
        end_time: segmentEnd(s),
      }))
      .filter((r) => r.text.trim().length > 0);
    if (rows.length > 0) {
      await admin.from("transcript_segments").insert(rows);
    }

    try {
      await runAiPipeline(admin, meetingId);
    } catch (e) {
      console.error("AI processing failed:", e);
    }
    return NextResponse.json({ ok: true });
  }

  // Unknown event — ack to avoid retry storms.
  return NextResponse.json({ ok: true, ignored: event });
}
