// Meeting BaaS integration layer (Phase 2).
// Meetly never implements its own browser-bot infrastructure —
// all join/record/transcribe duties are delegated to Meeting BaaS.
//
// NOTE: Implement against the current Meeting BaaS API docs, not a
// hard-coded older payload. The types below are the minimal contract
// Meetly needs; extend them when wiring the real API.

export interface JoinMeetingParams {
  meetingUrl: string;
  botName?: string;
  webhookUrl?: string;
}

export interface JoinMeetingResult {
  botId: string;
}

export type BaasEventType =
  | "bot.joining"
  | "bot.joined"
  | "bot.in_meeting"
  | "bot.completed"
  | "bot.failed";

export interface BaasWebhookPayload {
  event: BaasEventType | string;
  bot_id?: string;
  botId?: string;
  data?: Record<string, unknown>;
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

  // TODO: pin this to the current Meeting BaaS API reference
  // (endpoint path + body schema) before going live.
  const res = await fetch(`${baseUrl}/bots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-spoke-api-key": apiKey,
    },
    body: JSON.stringify({
      meeting_url: params.meetingUrl,
      bot_name: params.botName ?? "Meetly Notetaker",
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
  return payload.bot_id ?? payload.botId ?? null;
}
