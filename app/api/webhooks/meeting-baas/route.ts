import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractBotId, type BaasWebhookPayload } from "@/lib/meeting-baas/client";
import { normalizeTranscript } from "@/lib/utils/meetings";
import { summarizeTranscript } from "@/lib/ai/summarize";

// POST /api/webhooks/meeting-baas (PRD §12)
// Lifecycle: bot.joining → bot.joined → bot.in_meeting → bot.completed
export async function POST(req: Request) {
  // Optional shared-secret check (configure MEETING_BAAS_WEBHOOK_SECRET in BaaS dashboard).
  const secret = process.env.MEETING_BAAS_WEBHOOK_SECRET;
  if (secret) {
    const sig =
      req.headers.get("x-webhook-secret") ??
      req.headers.get("x-meeting-baas-secret");
    if (sig !== secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = (await req.json().catch(() => null)) as BaasWebhookPayload | null;
  if (!payload?.event) {
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

  if (event === "bot.joining" || event === "bot.joined" || event === "bot.in_meeting") {
    const status = event === "bot.in_meeting" ? "in_progress" : "joining";
    await admin.from("meetings").update({ status }).eq("id", meeting.id);
    return NextResponse.json({ ok: true });
  }

  if (event === "bot.failed") {
    await admin.from("meetings").update({ status: "failed" }).eq("id", meeting.id);
    return NextResponse.json({ ok: true });
  }

  if (event === "bot.completed") {
    await admin
      .from("meetings")
      .update({
        status: "processing",
        ended_at: new Date().toISOString(),
        recording_url: (data.recording_url as string) ?? null,
        transcript_status: "received",
      })
      .eq("id", meeting.id);

    // Persist transcript segments when the payload carries them.
    const rawSegments = data.transcript ?? data.transcript_segments;
    if (Array.isArray(rawSegments) && rawSegments.length > 0) {
      const rows = rawSegments.map((s: Record<string, unknown>) => ({
        meeting_id: meeting.id,
        speaker: (s.speaker as string) ?? null,
        speaker_id: (s.speaker_id as string) ?? null,
        text: String(s.text ?? ""),
        start_time: (s.start_time as number) ?? null,
        end_time: (s.end_time as number) ?? null,
      }));
      await admin.from("transcript_segments").insert(rows);
    }

    // Fire AI processing (best-effort; failure leaves meeting in `processing`).
    try {
      const { data: segments } = await admin
        .from("transcript_segments")
        .select("speaker,text,start_time")
        .eq("meeting_id", meeting.id)
        .order("start_time", { ascending: true });

      if (segments && segments.length > 0 && process.env.OPENAI_API_KEY) {
        const transcript = normalizeTranscript(segments);
        const result = await summarizeTranscript(transcript);
        const insights = [
          { meeting_id: meeting.id, type: "summary" as const, content: result.summary },
          ...result.topics.map((t) => ({
            meeting_id: meeting.id,
            type: "key_topic" as const,
            content: t,
          })),
          ...result.decisions.map((d) => ({
            meeting_id: meeting.id,
            type: "decision" as const,
            content: d,
          })),
          ...result.action_items.map((a) => ({
            meeting_id: meeting.id,
            type: "action_item" as const,
            content: a.description,
            metadata: { assignee: a.assignee ?? null, due_date: a.due_date ?? null },
          })),
        ];
        await admin.from("meeting_insights").insert(insights);
        await admin
          .from("meetings")
          .update({ status: "completed", summary_status: "done" })
          .eq("id", meeting.id);
      }
    } catch (e) {
      console.error("AI processing failed:", e);
    }

    return NextResponse.json({ ok: true });
  }

  // Unknown event — ack to avoid retries storms.
  return NextResponse.json({ ok: true, ignored: event });
}
