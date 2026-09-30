import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getUserId } from "@/lib/supabase/server";
import { isValidMeetingUrl } from "@/lib/utils/meetings";
import {
  isMeetingBaasConfigured,
  joinMeetingViaBaas,
} from "@/lib/meeting-baas/client";

const CreateMeetingSchema = z.object({
  meetingUrl: z.string().url(),
  botName: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
});

// POST /api/meetings — create meeting record + dispatch Meeting BaaS bot (PRD §8)
export async function POST(req: Request) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const userId = await getUserId(supabase);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { meetingUrl, botName, title } = parsed.data;
  if (!isValidMeetingUrl(meetingUrl)) {
    return NextResponse.json(
      { error: "Only Google Meet URLs (https://meet.google.com/…) are supported in MVP." },
      { status: 400 }
    );
  }

  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      user_id: userId,
      title: title ?? null,
      meeting_url: meetingUrl,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !meeting) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create meeting." },
      { status: 500 }
    );
  }

  // Dispatch bot (v2 API). Completion/failure webhooks arrive at the
  // account-level endpoint — configure it once in the Meeting BaaS dashboard:
  // https://<app>/api/webhooks/meeting-baas (events: bot.completed, bot.failed,
  // bot.status_change). If BaaS is not configured, keep the meeting in
  // `scheduled` so the flow can be tested end-to-end later.
  if (isMeetingBaasConfigured()) {
    try {
      const { botId } = await joinMeetingViaBaas({
        meetingUrl,
        botName: botName ?? "8xMeetly Notetaker",
      });
      await supabase
        .from("meetings")
        .update({ bot_id: botId, status: "joining" })
        .eq("id", meeting.id);
    } catch (e) {
      await supabase
        .from("meetings")
        .update({ status: "failed" })
        .eq("id", meeting.id);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Bot dispatch failed." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ id: meeting.id }, { status: 201 });
}

// GET /api/meetings — list own meetings
export async function GET() {
  const supabase = await createClient();
  if (!(await getUserId(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meetings: data });
}
