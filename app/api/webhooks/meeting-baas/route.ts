import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractBotId,
  segmentStart,
  segmentText,
  type BaasWebhookPayload,
} from "@/lib/meeting-baas/client";
import { normalizeTranscript } from "@/lib/utils/meetings";
import { summarizeTranscript } from "@/lib/ai/summarize";

// POST /api/webhooks/meeting-baas
// Real Meeting BaaS contract (docs.meetingbaas.com):
//   event `complete`  → recording + transcript ready (data.mp4, data.transcript[])
//   event `failed`    → bot failed (data.error, data.message)
//   event `transcription_complete` → retranscription available (data.bot_id only)
// Always answer fast; Meeting BaaS retries failed deliveries.

function validSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Primary auth (per docs): the request carries our own API key back in
  // `x-meeting-baas-api-key`. Optional hardening: HMAC-SHA256 of the raw
  // body in `x-meetingbaas-signature` when MEETING_BAAS_WEBHOOK_SECRET is set.
  const apiKey = process.env.MEETING_BAAS_API_KEY;
  if (apiKey) {
    const headerKey = req.headers.get("x-meeting-baas-api-key");
    if (headerKey !== apiKey) {
      const secret = process.env.MEETING_BAAS_WEBHOOK_SECRET ?? "";
      const sig = req.headers.get("x-meetingbaas-signature");
      if (!secret || !validSignature(rawBody, sig, secret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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
    .select("id")
    .eq("bot_id", botId)
    .single();

  if (!meeting) return NextResponse.json({ error: "Unknown bot" }, { status: 404 });

  const event = payload.event;
  const data = payload.data ?? {};
  const meetingId = (meeting as { id: string }).id;

  if (event === "failed") {
    console.error("Meeting BaaS bot failed:", data.error, data.message);
    await admin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
    return NextResponse.json({ ok: true });
  }

  if (event === "transcription_complete") {
    // Retranscription landed — MVP has nothing to refetch, just ack.
    await admin
      .from("meetings")
      .update({ transcript_status: "received" })
      .eq("id", meetingId);
    return NextResponse.json({ ok: true });
  }

  if (event === "complete") {
    // NOTE: data.mp4 is valid 24h — download for permanent storage (V2).
    await admin
      .from("meetings")
      .update({
        status: "processing",
        ended_at: new Date().toISOString(),
        recording_url: typeof data.mp4 === "string" ? data.mp4 : null,
        transcript_status: "received",
      })
      .eq("id", meetingId);

    // Persist transcript segments (words[] → text).
    const rawSegments = Array.isArray(data.transcript) ? data.transcript : [];
    const rows = rawSegments
      .map((s) => ({
        meeting_id: meetingId,
        speaker: s.speaker ?? null,
        speaker_id: null,
        text: segmentText(s),
        start_time: segmentStart(s),
        end_time: s.end_time ?? null,
      }))
      .filter((r) => r.text.trim().length > 0);
    if (rows.length > 0) {
      await admin.from("transcript_segments").insert(rows);
    }

    // Fire AI processing (best-effort; failure leaves meeting in `processing`).
    try {
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
        return NextResponse.json({ ok: true });
      }

      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ ok: true, ai: "skipped" });
      }

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
    } catch (e) {
      console.error("AI processing failed:", e);
    }

    return NextResponse.json({ ok: true });
  }

  // Unknown event — ack to avoid retry storms.
  return NextResponse.json({ ok: true, ignored: event });
}
