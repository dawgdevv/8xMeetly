"use client";

import { useState } from "react";
import { Bot, LoaderCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormStatus } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "What decisions did we make?",
  "List the action items",
  "What should happen next?",
];

export function AskPanel({ meetingId }: { meetingId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [answeredQuestion, setAnsweredQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || loading) return;

    setError(null);
    setAnswer(null);
    setAnsweredQuestion(normalizedQuestion);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, question: normalizedQuestion }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn’t answer that question.");
      setAnswer(json.answer);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Check your connection and try again.`
          : "Couldn’t get an answer. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-border bg-background/70 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bot size={21} />
          </span>
          <h3 className="mt-4 text-base font-extrabold text-ink">A shortcut to the details</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Ask about decisions, owners, dates, or anything mentioned in this meeting. Answers are based on the transcript.
          </p>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.12em] text-muted">Try asking</p>
          <div className="mt-2.5 flex flex-col items-start gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading}
                onClick={() => {
                  setQuestion(suggestion);
                  setAnswer(null);
                  setError(null);
                }}
                className="min-h-10 max-w-full rounded-xl border border-border bg-card px-3 py-2 text-left text-[13px] font-semibold text-stone-600 transition-[border-color,background-color,color] hover:border-primary/35 hover:bg-primary/[0.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 p-5 sm:p-7">
          <form onSubmit={ask} className="space-y-4">
            <Field
              label="Your question"
              htmlFor="ask-question"
              hint="Ask one question at a time for the clearest answer."
            >
              <Textarea
                id="ask-question"
                name="question"
                rows={4}
                maxLength={2000}
                autoComplete="off"
                value={question}
                disabled={loading}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="For example: What did we agree to ship next week?…"
                className="min-h-[122px] resize-y"
              />
            </Field>
            <FormStatus error={error} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs tabular-nums text-muted">{question.length}/2,000</span>
              <Button type="submit" size="md" disabled={loading || !question.trim()}>
                {loading ? (
                  <>
                    <LoaderCircle size={16} aria-hidden="true" className="motion-safe:animate-spin" />
                    Thinking…
                  </>
                ) : (
                  <>
                    Ask AI <Send size={15} aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {loading && (
            <div role="status" aria-live="polite" className="mt-6 flex items-start gap-3 rounded-2xl bg-background p-4 ring-1 ring-border">
              <LoaderCircle size={17} aria-hidden="true" className="mt-0.5 motion-safe:animate-spin text-primary" />
              <div>
                <p className="text-sm font-bold text-ink">Searching the transcript…</p>
                <p className="mt-0.5 text-xs text-muted">This usually takes a few seconds.</p>
              </div>
            </div>
          )}

          {answer && !loading && (
            <section aria-live="polite" className="mt-6 rounded-2xl bg-background p-5 ring-1 ring-border">
              {answeredQuestion && (
                <p className="mb-3 break-words text-sm font-semibold leading-relaxed text-ink">
                  {answeredQuestion}
                </p>
              )}
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                <Sparkles size={14} aria-hidden="true" /> Answer
              </h3>
              <p className="mt-2 break-words whitespace-pre-wrap text-pretty text-[15px] leading-relaxed text-stone-700">
                {answer}
              </p>
            </section>
          )}
        </div>
      </div>
    </Card>
  );
}
