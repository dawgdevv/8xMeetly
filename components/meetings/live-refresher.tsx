"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Keeps the meeting page live with Supabase Realtime and provider reconciliation.
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
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let lastRefreshAt = 0;
    const refreshFromRealtime = () => {
      // A bulk transcript insert can emit one event per segment. Throttle the
      // resulting server-component refreshes so the UI doesn't stampede.
      if (refreshTimer) return;
      const wait = Math.max(0, 200 - (Date.now() - lastRefreshAt));
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        lastRefreshAt = Date.now();
        router.refresh();
      }, wait);
    };

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
          refreshFromRealtime
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transcript_segments",
            filter: `meeting_id=eq.${meetingId}`,
          },
          refreshFromRealtime
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "meeting_insights",
            filter: `meeting_id=eq.${meetingId}`,
          },
          refreshFromRealtime
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("Meeting realtime channel is unavailable", { meetingId, status });
          }
        });
    } catch {
      // Skeleton mode — polling below still works against nothing.
    }

    const syncStatus = async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}/sync-status`, {
          method: "POST",
          cache: "no-store",
        });
        if (!response.ok) return;
        const result = (await response.json()) as { changed?: boolean };
        if (result.changed) router.refresh();
      } catch {
        // Realtime remains available if provider reconciliation is unreachable.
      }
    };

    void syncStatus();
    const timer = setInterval(syncStatus, 15000);
    return () => {
      clearInterval(timer);
      if (refreshTimer) clearTimeout(refreshTimer);
      if (channel) channel.unsubscribe();
    };
  }, [meetingId, active, router]);

  return null;
}
