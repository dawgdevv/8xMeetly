import OpenAI from "openai";
import { buildAnalysisPrompt } from "./prompts";
import type { MeetingSummary } from "@/types/meetings";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey });
}

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function summarizeTranscript(
  transcript: string
): Promise<MeetingSummary> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildAnalysisPrompt(transcript) }],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<MeetingSummary>;
  return {
    summary: parsed.summary ?? "",
    topics: parsed.topics ?? [],
    decisions: parsed.decisions ?? [],
    action_items: parsed.action_items ?? [],
    unresolved_questions: parsed.unresolved_questions ?? [],
  };
}

export async function answerFromTranscript(
  transcript: string,
  question: string
): Promise<string> {
  const { buildAskPrompt } = await import("./prompts");
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: buildAskPrompt(transcript, question) }],
  });
  return completion.choices[0]?.message?.content ?? "";
}
