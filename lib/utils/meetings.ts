export const MEETING_URL_PATTERNS = [
  /^https:\/\/meet\.google\.com\/[a-z-]+\/?(\?.*)?$/i,
  // MVP: Google Meet only. Zoom/Teams land in V2.
];

export function isValidMeetingUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;
    // MVP scope: Google Meet only.
    return parsed.hostname === "meet.google.com";
  } catch {
    return false;
  }
}

export function normalizeTranscript(
  segments: Array<{ speaker?: string | null; text: string; start_time?: number | null }>
): string {
  return segments
    .map((s) => `${s.speaker ?? "Speaker"}: ${s.text}`)
    .join("\n");
}

export function formatTimestamp(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "00:00";
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const hh = Math.floor(s / 3600);
  if (hh > 0) {
    return `${String(hh).padStart(2, "0")}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return "—";
  const m = Math.round(totalSeconds / 60);
  if (m < 1) return "<1 min";
  if (m === 1) return "1 min";
  return `${m} min`;
}
