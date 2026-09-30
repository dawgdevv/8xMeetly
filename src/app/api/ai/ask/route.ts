import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getUserId } from "@/lib/supabase/server";
import { normalizeTranscript } from "@/lib/utils/meetings";
import { answerFromTranscript } from "@/lib/ai/summarize";

const Schema = z.object({
  meetingId: z.string().uuid(),
  question: z.string().min(1).max(2000),
});

// POST /api/ai/ask — MVP: send full transcript + question to the LLM (PRD §19)
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

  const answer = await answerFromTranscript(
    normalizeTranscript(segments),
    parsed.data.question
  );
  return NextResponse.json({ answer });
}
