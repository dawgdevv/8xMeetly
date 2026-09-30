// Meeting BaaS integration layer.
// Verified against https://docs.meetingbaas.com (bot webhook reference):
// - Base URL: https://api.meetingbaas.com, auth via `x-meeting-baas-api-key`
// - Webhook events: `complete` | `failed` | `transcription_complete`
// - bot_id lives in `data.bot_id`; transcript segments carry `words[]`
//   (no per-segment `text` — reconstruct from words); recording is `data.mp4`.
// Meetly never implements its own browser-bot infrastructure.

export interface JoinMeetingParams {
  meetingUrl: string;
  botName?: string;
  webhookUrl?: string;
}

export interface JoinMeetingResult {
  botId: string;
}

export type BaasEventType =
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
  words?: BaasTranscriptWord[];
  /** Non-standard fallback — real payloads use `words`. */
  text?: string;
}

export interface BaasWebhookPayload {
  event: string;
  data?: {
    bot_id?: string;
    event_uuid?: string | null;
    transcript?: BaasTranscriptSegment[];
    speakers?: string[];
    mp4?: string;
    audio?: string;
    error?: string;
    message?: string;
    [key: string]: unknown;
  };
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

/** Send a "join meeting" request to Meeting BaaS. Throws when unconfigured. */
export async function joinMeetingViaBaas(
  params: JoinMeetingParams
): Promise<JoinMeetingResult> {
  const { apiKey, baseUrl } = config();
  if (!apiKey) {
    throw new Error("Meeting BaaS is not configured (MEETING_BAAS_API_KEY).");
  }

  const res = await fetch(`${baseUrl}/bots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-meeting-baas-api-key": apiKey,
    },
    body: JSON.stringify({
      meeting_url: params.meetingUrl,
      bot_name: params.botName ?? "8xMeetly Notetaker",
      webhook_url: params.webhookUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meeting BaaS join failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { bot_id?: string; id?: string };
  const botId = json.bot_id ?? json.id;
  if (!botId) throw new Error("Meeting BaaS response missing bot_id.");
  return { botId };
}

export function extractBotId(payload: BaasWebhookPayload): string | null {
  return payload.data?.bot_id ?? null;
}

/** Reconstruct segment text from word-level timestamps. */
export function segmentText(segment: BaasTranscriptSegment): string {
  if (Array.isArray(segment.words) && segment.words.length > 0) {
    return segment.words.map((w) => w.word).join(" ");
  }
  return segment.text ?? "";
}

export function segmentStart(segment: BaasTranscriptSegment): number | null {
  return segment.start_time ?? segment.offset ?? null;
}
