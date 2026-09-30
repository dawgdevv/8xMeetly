import Link from "next/link";
import { Plus, Video } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MeetingCard } from "@/components/dashboard/meeting-card";
import { createClient } from "@/lib/supabase/server";

export default async function MeetingsPage() {
  let meetings: Array<{
    id: string;
    title: string | null;
    status: string;
    duration_seconds: number | null;
    created_at: string;
  }> = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("meetings")
      .select("id,title,status,duration_seconds,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    meetings = (data ?? []) as typeof meetings;
  } catch {
    // Skeleton mode — empty state below.
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-balance text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
            Meetings
          </h1>
          <p className="mt-1 text-sm text-muted">
            {meetings.length === 0
              ? "Your meeting history will live here."
              : `${meetings.length} meeting${meetings.length === 1 ? "" : "s"} captured.`}
          </p>
        </div>
        <Link
          href="/dashboard/meetings/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_10px_-6px_rgb(64_48_36/0.41)] transition-[background-color,transform] hover:bg-primary-dark active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          New Meeting
        </Link>
      </div>

      <div className="mt-6">
        {meetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No Meetings Yet"
            body="Paste a Google Meet link and the 8xMeetly bot will join, record, and write the notes."
            actionLabel="Start Your First Meeting"
            actionHref="/dashboard/meetings/new"
          />
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => (
              <MeetingCard
                key={m.id}
                id={m.id}
                title={m.title}
                status={m.status}
                durationSeconds={m.duration_seconds}
                createdAt={m.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
