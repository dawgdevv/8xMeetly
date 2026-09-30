import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TranscriptSearch } from "@/components/transcript/transcript-search";

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let title = "Meeting";
  let segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null }> = [];
  try {
    const supabase = await createClient();
    const { data: m } = await supabase.from("meetings").select("id,title").eq("id", id).single();
    if (!m) notFound();
    title = (m as { title: string | null }).title ?? "Untitled meeting";
    const { data: seg } = await supabase
      .from("transcript_segments")
      .select("id,speaker,text,start_time")
      .eq("meeting_id", id)
      .order("start_time", { ascending: true });
    segments = (seg ?? []) as typeof segments;
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <Link href={`/dashboard/meetings/${id}`} className="text-sm text-muted hover:text-foreground">← Back to overview</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">{title}</h1>
      <p className="text-sm text-muted mb-6">Transcript</p>
      <TranscriptSearch segments={segments} />
    </div>
  );
}
