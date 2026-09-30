"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Keeps the meeting page live: Supabase Realtime pushes refresh on any
// meeting/transcript/insight change, with a 15s poll fallback in case
// Realtime is disabled on the project.
export function LiveRefresher({
  meetingId,
  active,
}: {
  meetingId: string;
  active: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`meeting-${meetingId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "meetings",
            filter: `id=eq.${meetingId}`,
          },
          () => router.refresh()
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transcript_segments",
            filter: `meeting_id=eq.${meetingId}`,
          },
          () => router.refresh()
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "meeting_insights",
            filter: `meeting_id=eq.${meetingId}`,
          },
          () => router.refresh()
        )
        .subscribe();
    } catch {
      // Skeleton mode — polling below still works against nothing.
    }

    const timer = setInterval(() => router.refresh(), 15000);
    return () => {
      clearInterval(timer);
      if (channel) channel.unsubscribe();
    };
  }, [meetingId, active, router]);

  return null;
}
