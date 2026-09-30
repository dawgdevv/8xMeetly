import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, statusTone } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils/meetings";

export default async function DashboardPage() {
  let meetings: Array<{
    id: string;
    title: string | null;
    status: string;
    duration_seconds: number | null;
    created_at: string;
  }> = [];
  let configured = true;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("meetings")
        .select("id,title,status,duration_seconds,created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      meetings = (data ?? []) as typeof meetings;
    }
  } catch {
    configured = false;
  }

  const totalMinutes = meetings.reduce((s, m) => s + (m.duration_seconds ?? 0), 0) / 60;
  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = meetings.filter(
    (m) => new Date(m.created_at).getTime() > weekAgo
  ).length;

  const stats = [
    { label: "Meetings", value: String(meetings.length) },
    { label: "This Week", value: String(thisWeek) },
    { label: "Minutes Recorded", value: String(Math.round(totalMinutes)) },
    { label: "Action Items", value: "—" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/dashboard/meetings/new">
          <Button>+ New Meeting</Button>
        </Link>
      </div>

      {!configured && (
        <Card className="p-4 mb-6 border-amber-500/30">
          <p className="text-sm text-muted">
            Supabase is not configured yet. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then run{" "}
            <code>supabase/migrations/0001_meetly_foundation.sql</code>.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Meetings</h2>
      {meetings.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="font-semibold mb-1">No meetings yet</p>
          <p className="text-sm text-muted mb-6">
            Connect your first meeting and let Meetly take the notes for you.
          </p>
          <Link href="/dashboard/meetings/new">
            <Button>+ Start Your First Meeting</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <Link key={m.id} href={`/dashboard/meetings/${m.id}`}>
              <Card className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                <div>
                  <p className="font-medium">{m.title ?? "Untitled meeting"}</p>
                  <p className="text-sm text-muted">
                    {new Date(m.created_at).toLocaleDateString()} · {formatDuration(m.duration_seconds)}
                  </p>
                </div>
                <Badge tone={statusTone(m.status)}>{m.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
