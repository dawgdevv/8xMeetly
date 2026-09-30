import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/ui/back-button";
import { TranscriptSearch } from "@/components/transcript/transcript-search";

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let title: string | null = "Meeting";
  let segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null }> = [];
  try {
    const supabase = await createClient();
    const { data: m } = await supabase.from("meetings").select("id,title").eq("id", id).single();
    if (!m) notFound();
    title = (m.title as string | null) ?? "Untitled meeting";
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
      <BackButton fallbackHref={`/dashboard/meetings/${id}`} />
      <h1 className="mt-3 text-balance text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
        {title}
      </h1>
      <p className="mb-5 mt-1 text-sm text-muted">Full transcript</p>
      <TranscriptSearch segments={segments} />
    </div>
  );
}
