"use client";

import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { formatTimestamp } from "@/lib/utils/meetings";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 50;

export function TranscriptSearch({
  segments,
}: {
  segments: Array<{ id: string; speaker: string | null; text: string; start_time: number | null }>;
}) {
  const [q, setQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const query = q.trim().toLowerCase();
  const filtered = query
    ? segments.filter(
        (s) =>
          s.text.toLowerCase().includes(query) ||
          (s.speaker ?? "").toLowerCase().includes(query)
      )
    : segments;

  if (segments.length === 0) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[20px] border border-border bg-card px-6 py-14 text-center shadow-[0_1px_2px_rgb(41_39_33/0.04),0_12px_32px_-25px_rgb(41_39_33/0.34)]">
        <span
          aria-hidden="true"
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/[0.09] text-primary"
        >
          <FileText size={26} strokeWidth={2} />
        </span>
        <h2 className="mt-5 text-xl font-extrabold tracking-tight text-ink">
          No Transcript Yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted">
          The transcript appears here once the meeting finishes processing.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="transcript-search" className="sr-only">
        Search transcript
      </label>
      <div className="relative">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          id="transcript-search"
          name="transcript-search"
          type="search"
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search what was said…"
          className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-stone-400 transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>
      <p aria-live="polite" className="mt-3 text-[13px] font-medium tabular-nums text-muted">
        {query
          ? `${filtered.length} of ${segments.length} segments match`
          : `${segments.length} segments`}
      </p>
      <div className="mt-3 space-y-5 rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_2px_rgb(41_39_33/0.04),0_12px_32px_-25px_rgb(41_39_33/0.34)] sm:p-7">
        {filtered.slice(0, visibleCount).map((s) => (
          <div key={s.id} className="min-w-0">
            <p className="text-xs font-bold tabular-nums text-primary">
              {formatTimestamp(s.start_time)} ·{" "}
              <span className="text-ink">{s.speaker ?? "Speaker"}</span>
            </p>
            <p className="mt-1 break-words text-[15px] leading-relaxed text-stone-600">{s.text}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted">
            Nothing matches your search. Try a different word.
          </p>
        )}
      </div>
      {filtered.length > visibleCount && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Show next {Math.min(PAGE_SIZE, filtered.length - visibleCount)} segments
          </Button>
        </div>
      )}
    </div>
  );
}
