import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatTimestamp } from "@/lib/utils/meetings";

function groupInsights(insights: Array<{ type: string; content: string }>) {
  return {
    summary: insights.find((i) => i.type === "summary")?.content ?? null,
    topics: insights.filter((i) => i.type === "key_topic").map((i) => i.content),
    decisions: insights.filter((i) => i.type === "decision").map((i) => i.content),
    actions: insights.filter((i) => i.type === "action_item").map((i) => i.content),
  };
}

const STEPS = ["Connecting", "Recording", "Processing", "Complete"] as const;

function stepIndex(status: string): number {
  switch (status) {
    case "scheduled":
    case "joining": return 0;
    case "in_progress": return 1;
    case "processing": return 2;
    case "completed": return 3;
    default: return 0;
  }
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let meeting: { id: string; title: string | null; status: string; duration_seconds: number | null; created_at: string } | null = null;
  let insights: Array<{ type: string; content: string }> = [];
  let segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null }> = [];

  try {
    const supabase = await createClient();
    const { data: m } = await supabase.from("meetings").select("id,title,status,duration_seconds,created_at").eq("id", id).single();
    if (!m) notFound();
    meeting = {
      id: String(m.id),
      title: (m.title as string | null) ?? null,
      status: String(m.status),
      duration_seconds: (m.duration_seconds as number | null) ?? null,
      created_at: String(m.created_at),
    };
    const [{ data: ins }, { data: seg }] = await Promise.all([
      supabase.from("meeting_insights").select("type,content").eq("meeting_id", id),
      supabase.from("transcript_segments").select("id,speaker,text,start_time").eq("meeting_id", id).order("start_time", { ascending: true }).limit(200),
    ]);
    insights = (ins ?? []) as typeof insights;
    segments = (seg ?? []) as typeof segments;
  } catch {
    notFound();
  }

  if (!meeting) notFound();
  const grouped = groupInsights(insights);
  const idx = stepIndex(meeting.status);
  const done = meeting.status === "completed";

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">{meeting.title ?? "Untitled meeting"}</h1>
          <p className="text-sm text-muted">
            {new Date(meeting.created_at).toLocaleDateString()} · {formatDuration(meeting.duration_seconds)}
          </p>
        </div>
        <Badge tone={statusTone(meeting.status)}>{meeting.status}</Badge>
      </div>

      <div className="flex gap-4 text-sm mb-6">
        <span className="font-medium text-foreground">Overview</span>
        <Link href={`/dashboard/meetings/${id}/transcript`} className="text-muted hover:text-foreground">Transcript</Link>
        <Link href={`/dashboard/meetings/${id}/ask`} className="text-muted hover:text-foreground">Ask AI</Link>
      </div>

      {!done ? (
        <Card className="p-6">
          <p className="font-medium mb-4">
            {meeting.status === "processing" ? "Processing meeting…" : "Meetly is joining the meeting…"}
          </p>
          <ol className="space-y-2 text-sm">
            {STEPS.map((s, i) => (
              <li key={s} className={i <= idx ? "text-foreground" : "text-muted"}>
                {i < idx || done ? "✓" : i === idx ? "●" : "○"} {s}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted mt-4">Status updates automatically via webhooks. Refresh to check.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.summary && (
            <Card className="p-6">
              <h2 className="font-semibold mb-2">Summary</h2>
              <p className="text-sm text-muted leading-relaxed">{grouped.summary}</p>
            </Card>
          )}
          {grouped.topics.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold mb-2">Key Topics</h2>
              <ul className="text-sm text-muted space-y-1">
                {grouped.topics.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </Card>
          )}
          {grouped.decisions.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold mb-2">Decisions</h2>
              <ul className="text-sm text-muted space-y-1">
                {grouped.decisions.map((d, i) => <li key={i}>✓ {d}</li>)}
              </ul>
            </Card>
          )}
          {grouped.actions.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold mb-2">Action Items</h2>
              <ul className="text-sm text-muted space-y-1">
                {grouped.actions.map((a, i) => <li key={i}>☐ {a}</li>)}
              </ul>
            </Card>
          )}
          {segments.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Transcript preview</h2>
                <Link href={`/dashboard/meetings/${id}/transcript`} className="text-sm text-primary hover:underline">View full</Link>
              </div>
              <div className="space-y-3">
                {segments.slice(0, 5).map((s) => (
                  <div key={s.id} className="text-sm">
                    <p className="text-muted text-xs">{formatTimestamp(s.start_time)} · {s.speaker ?? "Speaker"}</p>
                    <p>{s.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
