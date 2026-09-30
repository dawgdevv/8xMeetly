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
    <div className="mx-auto w-full max-w-[900px]">
      <BackButton fallbackHref={`/dashboard/meetings/${id}`} />
      <h1 className="mt-4 text-balance text-[27px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">
        {title}
      </h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-muted sm:text-[15px]">Full transcript</p>
      <TranscriptSearch segments={segments} />
    </div>
  );
}
