import Link from "next/link";
import { CalendarDays, ListTodo, Plus, Timer, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MeetingCard } from "@/components/dashboard/meeting-card";
import { createClient } from "@/lib/supabase/server";
import { greetingForHour } from "@/lib/utils/format";

export default async function DashboardPage() {
  let userName: string | null = null;
  let meetings: Array<{
    id: string;
    title: string | null;
    status: string;
    duration_seconds: number | null;
    created_at: string;
  }> = [];
  let actionCount = 0;
  let totalMeetings = 0;
  let totalMinutes = 0;
  let thisWeek = 0;
  let configured = true;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userName =
        (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
        user.email?.split("@")[0] ??
        null;
      const [{ data }, { data: idRows }] = await Promise.all([
        supabase
          .from("meetings")
          .select("id,title,status,duration_seconds,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("meetings").select("id,duration_seconds,created_at"),
      ]);
      meetings = (data ?? []) as typeof meetings;
      const allMeetings = (idRows ?? []) as Array<{
        id: string;
        duration_seconds: number | null;
        created_at: string;
      }>;
      const ids = allMeetings.map((r) => r.id);
      totalMeetings = allMeetings.length;
      totalMinutes = Math.round(
        allMeetings.reduce((sum, m) => sum + (m.duration_seconds ?? 0), 0) / 60
      );
      // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
      const weekAgo = Date.now() - 7 * 864e5;
      thisWeek = allMeetings.filter(
        (m) => new Date(m.created_at).getTime() > weekAgo
      ).length;
      if (ids.length > 0) {
        const { count } = await supabase
          .from("meeting_insights")
          .select("id", { count: "exact", head: true })
          .eq("type", "action_item")
          .in("meeting_id", ids);
        actionCount = count ?? 0;
      }
    }
  } catch {
    configured = false;
  }

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-balance text-[27px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">
            {greetingForHour(new Date().getHours())}
            {userName ? `, ${userName}` : ""}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-muted sm:text-[15px]">
            Here is what your meetings turned into.
          </p>
        </div>
        <Link
          href="/dashboard/meetings/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_16px_-9px_rgb(128_42_25/0.7)] transition-[background-color,transform,box-shadow] hover:bg-primary-dark hover:shadow-[0_10px_18px_-9px_rgb(128_42_25/0.7)] active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          New Meeting
        </Link>
      </div>

      {!configured && (
        <Card className="mt-5 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm leading-relaxed text-amber-900">
            Supabase is not connected yet. Set{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
            then run{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-[13px]">
              supabase/migrations/0001_meetly_foundation.sql
            </code>
            .
          </p>
        </Card>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Meetings" value={String(totalMeetings)} icon={Video} tint="bg-primary/10 text-primary" />
        <StatCard label="This Week" value={String(thisWeek)} icon={CalendarDays} tint="bg-peach text-ink" />
        <StatCard label="Minutes Recorded" value={String(totalMinutes)} icon={Timer} tint="bg-amber-100 text-amber-700" />
        <StatCard label="Action Items" value={String(actionCount)} icon={ListTodo} tint="bg-green-100 text-green-700" />
      </div>

      <h2 className="mb-3.5 mt-9 text-lg font-extrabold tracking-tight text-ink sm:text-xl">
        Recent Meetings
      </h2>
      {meetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No Meetings Yet"
          body="Connect your first meeting and let 8xMeetly take the notes for you."
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
  );
}
