"use client";

import { useState } from "react";
import { formatTimestamp } from "@/lib/utils/meetings";

export function TranscriptSearch({
  segments,
}: {
  segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null }>;
}) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? segments.filter(
        (s) =>
          s.text.toLowerCase().includes(q.toLowerCase()) ||
          (s.speaker ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : segments;

  if (segments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="font-medium mb-1">No transcript yet</p>
        <p className="text-sm text-muted">The transcript will appear here once the meeting is processed.</p>
      </div>
    );
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search transcript…"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-4 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <div className="space-y-4">
        {filtered.map((s) => (
          <div key={s.id}>
            <p className="text-xs text-muted">{formatTimestamp(s.start_time)} · {s.speaker ?? "Speaker"}</p>
            <p className="text-sm mt-0.5">{s.text}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted">No matches.</p>}
      </div>
    </div>
  );
}
