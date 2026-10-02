import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { WebSocketServer } from "ws";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MEETING_BAAS_STREAM_SECRET } = process.env;
const PORT = Number(process.env.PORT ?? 8080);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MEETING_BAAS_STREAM_SECRET) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and MEETING_BAAS_STREAM_SECRET are required.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const server = createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"ok":true}');
    return;
  }
  res.writeHead(404);
  res.end();
});
const webSockets = new WebSocketServer({ noServer: true, maxPayload: 65536 });
const meetingCache = new Map();

function secretMatches(candidate) {
  if (!candidate) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(MEETING_BAAS_STREAM_SECRET);
  return left.length === right.length && timingSafeEqual(left, right);
}

server.on("upgrade", (req, socket, head) => {
  let requestUrl;
  try {
    requestUrl = new URL(req.url ?? "/", "http://localhost");
  } catch {
    socket.destroy();
    return;
  }

  if (requestUrl.pathname !== "/transcripts" || !secretMatches(requestUrl.searchParams.get("token"))) {
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  webSockets.handleUpgrade(req, socket, head, (ws) => {
    webSockets.emit("connection", ws, req);
  });
});

async function getMeetingId(botId) {
  const cached = meetingCache.get(botId);
  if (cached) return cached;

  // The bot can connect seconds after the create request. Give the app time
  // to persist bot_id before dropping the first transcript event.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from("meetings")
      .select("id")
      .eq("bot_id", botId)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) {
      meetingCache.set(botId, data.id);
      return data.id;
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  return null;
}

function segmentKey(botId, startTime) {
  return `${botId}:${Math.round(startTime * 1000)}`;
}

webSockets.on("connection", (ws) => {
  let botId = null;
  let messageQueue = Promise.resolve();
  const pendingSegments = new Map();

  ws.on("message", (raw) => {
    messageQueue = messageQueue
      .then(async () => {
        let message;
        try {
          message = JSON.parse(raw.toString());
        } catch {
          console.warn("Ignoring malformed live-transcript message");
          return;
        }

        if (typeof message.bot_id === "string") botId = message.bot_id;
        if (!botId) return;

        if (message.event === "session.started") {
          console.info("Live transcription session started", { botId });
          return;
        }
        if (message.event === "error") {
          console.error("Live transcription provider error", {
            botId,
            code: message.data?.code,
            message: message.data?.message,
          });
          return;
        }
        if (message.event !== "transcript.segment") return;

        const segment = message.data;
        const startTime = Number(segment.utteranceStart);
        const text = typeof segment.text === "string" ? segment.text.trim() : "";
        const endTime = Number(segment.utteranceEnd);
        const isFinal = segment.isFinal === true;
        if (!text || !Number.isFinite(startTime) || typeof segment.isFinal !== "boolean") return;

        const boundedEnd = Number.isFinite(endTime) ? endTime : startTime;
        const speakerId = segment.speaker?.id == null ? null : String(segment.speaker.id);
        let matchedKey = null;
        let bestOverlap = -Infinity;
        for (const [candidateKey, pending] of pendingSegments) {
          if (speakerId && pending.speakerId && speakerId !== pending.speakerId) continue;
          const overlap = Math.min(boundedEnd, pending.endTime) - Math.max(startTime, pending.startTime);
          if (overlap >= -0.2 && overlap > bestOverlap) {
            matchedKey = candidateKey;
            bestOverlap = overlap;
          }
        }
        const providerKey = matchedKey ?? segmentKey(botId, startTime);
        if (isFinal) {
          if (matchedKey) pendingSegments.delete(matchedKey);
        } else {
          pendingSegments.set(providerKey, {
            startTime: matchedKey
              ? Math.min(startTime, pendingSegments.get(matchedKey).startTime)
              : startTime,
            endTime: matchedKey
              ? Math.max(boundedEnd, pendingSegments.get(matchedKey).endTime)
              : boundedEnd,
            speakerId,
          });
        }

        const meetingId = await getMeetingId(botId);
        if (!meetingId) {
          console.error("No meeting row found for live transcript bot", { botId });
          return;
        }

        const speaker = segment.speaker;
        const row = {
          meeting_id: meetingId,
          speaker: typeof speaker?.name === "string" ? speaker.name : null,
          speaker_id: speakerId,
          text,
          start_time: startTime,
          end_time: Number.isFinite(endTime) ? endTime : null,
          provider_segment_key: providerKey,
          is_final: isFinal,
        };
        const { error } = await supabase
          .from("transcript_segments")
          .upsert(row, { onConflict: "provider_segment_key" });
        if (error) throw error;
        console.info("Saved live transcript segment", {
          botId,
          meetingId,
          startTime,
          isFinal,
          characters: text.length,
        });
      })
      .catch((error) => {
        console.error("Could not process live-transcript event", {
          botId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
  });

  ws.on("close", () => {
    if (botId) console.info("Live transcription socket closed", { botId });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.info("Live transcript WebSocket service listening", { port: PORT });
});

function shutdown() {
  webSockets.close();
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
