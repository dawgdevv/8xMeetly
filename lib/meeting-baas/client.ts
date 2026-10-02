// Meeting BaaS integration layer — API v2.
// Verified against https://docs.meetingbaas.com (v2 reference):
// - Join: POST https://api.meetingbaas.com/v2/bots with transcription_config.provider=gladia
//         → {data: {bot_id}, success: true}, auth via `x-meeting-baas-api-key`
// - Completion: v2 webhooks `bot.status_change` / `bot.completed` / `bot.failed`
//   (account-level, SVIX-signed). bot.completed carries ARTIFACT URLS —
//   fetch data.transcription ({result: {utterances: [{speaker, text, start,
//   end, words[]}]}}) within 4h (presigned). Recording: data.mp4.
// - v1 `complete`/`failed` handlers kept as fallback.
// Meetly never implements its own browser-bot infrastructure.

export interface JoinMeetingParams {
  meetingUrl: string;
  botName?: string;
}

export interface JoinMeetingResult {
  botId: string;
}

export interface BaasBotSnapshot {
  bot_id: string;
  status: string;
  joined_at?: string | null;
  exited_at?: string | null;
  duration_seconds?: number | null;
  transcription?: unknown;
}

export type BaasEventType =
  | "bot.status_change"
  | "bot.completed"
  | "bot.failed"
  | "complete"
  | "failed"
  | "transcription_complete";

export interface BaasTranscriptWord {
  start: number;
  end: number;
  word: string;
}

export interface BaasTranscriptSegment {
  speaker?: string;
  offset?: number;
  start_time?: number;
  end_time?: number;
  start?: number;
  end?: number;
  words?: BaasTranscriptWord[];
  /** Fallbacks — v2 utterances and non-standard shapes. */
  text?: string;
}

export interface BaasStatusChange {
  code?: string;
  created_at?: string;
  start_time?: number;
  error_message?: string;
}

export interface BaasWebhookPayload {
  event: string;
  data?: {
    bot_id?: string;
    event_id?: string;
    event_uuid?: string | null;
    status?: BaasStatusChange;
    transcription?: string;
    transcript?: BaasTranscriptSegment[];
    speakers?: string[];
    mp4?: string;
    audio?: string;
    duration_seconds?: number;
    error?: string;
    message?: string;
    extra?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface TranscriptSegmentLike {
  speaker: string | null;
  text: string;
  start_time: number | null;
  end_time: number | null;
}

function config() {
  const apiKey = process.env.MEETING_BAAS_API_KEY;
  const baseUrl =
    process.env.MEETING_BAAS_API_URL ?? "https://api.meetingbaas.com";
  return { apiKey, baseUrl };
}

export function isMeetingBaasConfigured(): boolean {
  return Boolean(process.env.MEETING_BAAS_API_KEY);
}

/** Read the authoritative lifecycle state as a fallback for missed webhooks. */
export async function fetchBaasBotSnapshot(botId: string): Promise<BaasBotSnapshot> {
  const { apiKey, baseUrl } = config();
  if (!apiKey) {
    throw new Error("Meeting BaaS is not configured (MEETING_BAAS_API_KEY).");
  }

  const res = await fetch(`${baseUrl}/v2/bots/${encodeURIComponent(botId)}`, {
    headers: { "x-meeting-baas-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meeting BaaS status lookup failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    data?: BaasBotSnapshot;
    bot_id?: string;
    status?: string;
  };
  const bot = json.data ?? json;
  if (typeof bot.bot_id !== "string" || typeof bot.status !== "string") {
    throw new Error("Meeting BaaS status response is missing bot_id or status.");
  }
  return bot as BaasBotSnapshot;
}

/** Send a "join meeting" request to Meeting BaaS (v2). Throws when unconfigured. */
export async function joinMeetingViaBaas(
  params: JoinMeetingParams
): Promise<JoinMeetingResult> {
  const { apiKey, baseUrl } = config();
  if (!apiKey) {
    throw new Error("Meeting BaaS is not configured (MEETING_BAAS_API_KEY).");
  }

  const res = await fetch(`${baseUrl}/v2/bots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-meeting-baas-api-key": apiKey,
    },
    body: JSON.stringify({
      bot_name: params.botName ?? "8xMeetly Notetaker",
      meeting_url: params.meetingUrl,
      transcription_enabled: true,
      transcription_config: { provider: "gladia" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meeting BaaS join failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    data?: { bot_id?: string };
    success?: boolean;
    bot_id?: string;
    id?: string;
  };
  const botId = json.data?.bot_id ?? json.bot_id ?? json.id;
  if (!botId) throw new Error("Meeting BaaS response missing bot_id.");
  return { botId };
}

export function extractBotId(payload: BaasWebhookPayload): string | null {
  return payload.data?.bot_id ?? null;
}

/** Reconstruct segment text from word-level timestamps (v1 shape fallback). */
export function segmentText(segment: BaasTranscriptSegment): string {
  if (Array.isArray(segment.words) && segment.words.length > 0) {
    return segment.words.map((w) => w.word).join(" ");
  }
  return segment.text ?? "";
}

export function segmentStart(segment: BaasTranscriptSegment): number | null {
  return segment.start_time ?? segment.start ?? segment.offset ?? null;
}

export function segmentEnd(segment: BaasTranscriptSegment): number | null {
  return segment.end_time ?? segment.end ?? null;
}

/** Fetch a v2 transcription artifact (presigned URL, valid 4h) and normalize
 *  its utterances to transcript segments. Accepts shape variants defensively. */
export async function fetchV2Transcription(
  transcriptionUrl: string
): Promise<TranscriptSegmentLike[]> {
  const res = await fetch(transcriptionUrl, {
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`Transcription download failed (${res.status}).`);
  }
  const json = (await res.json()) as {
    result?: { utterances?: BaasTranscriptSegment[] };
    utterances?: BaasTranscriptSegment[];
    transcript?: BaasTranscriptSegment[];
  };

  const utterances =
    json.result?.utterances ??
    json.utterances ??
    json.transcript ??
    (Array.isArray(json) ? (json as BaasTranscriptSegment[]) : []);

  return utterances
    .map((u) => ({
      speaker: u.speaker ?? null,
      text: segmentText(u),
      start_time: segmentStart(u),
      end_time: segmentEnd(u),
    }))
    .filter((r) => r.text.trim().length > 0);
}
