import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getUserId } from "@/lib/supabase/server";
import { normalizeTranscript } from "@/lib/utils/meetings";
import { summarizeTranscript } from "@/lib/ai/summarize";

const Schema = z.object({ meetingId: z.string().uuid() });

// POST /api/ai/summarize — (re)generate AI notes for an owned meeting
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const supabase = await createClient();
  if (!(await getUserId(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id")
    .eq("id", parsed.data.meetingId)
    .single();
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: segments } = await supabase
    .from("transcript_segments")
    .select("speaker,text,start_time")
    .eq("meeting_id", meeting.id)
    .order("start_time", { ascending: true });

  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "No transcript yet." }, { status: 400 });
  }

  const result = await summarizeTranscript(normalizeTranscript(segments));

  // Replace previous insights.
  await supabase.from("meeting_insights").delete().eq("meeting_id", meeting.id);
  await supabase.from("meeting_insights").insert([
    { meeting_id: meeting.id, type: "summary", content: result.summary },
    ...result.topics.map((t) => ({ meeting_id: meeting.id, type: "key_topic" as const, content: t })),
    ...result.decisions.map((d) => ({ meeting_id: meeting.id, type: "decision" as const, content: d })),
    ...result.action_items.map((a) => ({
      meeting_id: meeting.id,
      type: "action_item" as const,
      content: a.description,
      metadata: { assignee: a.assignee ?? null, due_date: a.due_date ?? null },
    })),
  ]);
  await supabase.from("meetings").update({ summary_status: "done" }).eq("id", meeting.id);

  return NextResponse.json(result);
}
