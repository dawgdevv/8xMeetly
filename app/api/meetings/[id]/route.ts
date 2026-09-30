import { NextResponse } from "next/server";
import { createClient, getUserId } from "@/lib/supabase/server";

async function ownedMeeting(meetingId: string) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return { supabase, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  // RLS already scopes to the owner; treat missing as 404 to avoid leaking existence.
  if (error || !meeting) {
    return { supabase, error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { supabase, meeting };
}

// GET /api/meetings/[id] — meeting + segments + insights (ownership-checked)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, meeting, error } = await ownedMeeting(id);
  if (error || !meeting) return error!;

  const [{ data: segments }, { data: insights }] = await Promise.all([
    supabase.from("transcript_segments").select("*").eq("meeting_id", id).order("start_time", { ascending: true }),
    supabase.from("meeting_insights").select("*").eq("meeting_id", id),
  ]);

  return NextResponse.json({ meeting, segments: segments ?? [], insights: insights ?? [] });
}

// DELETE /api/meetings/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, meeting, error } = await ownedMeeting(id);
  if (error || !meeting) return error!;

  const { error: delError } = await supabase.from("meetings").delete().eq("id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
