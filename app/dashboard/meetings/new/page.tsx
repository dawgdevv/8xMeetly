"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { Field, FormStatus } from "@/components/ui/field";
import { isValidMeetingUrl } from "@/lib/utils/meetings";

export default function NewMeetingPage() {
  const router = useRouter();
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botName, setBotName] = useState("8xMeetly Notetaker");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidMeetingUrl(meetingUrl)) {
      setUrlError("Enter a valid Google Meet link, like https://meet.google.com/abc-defg-hij…");
      return;
    }
    setUrlError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl: meetingUrl.trim(), botName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create meeting.");
      router.push(`/dashboard/meetings/${json.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Try again in a moment.`
          : "Failed to create the meeting. Try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <BackButton fallbackHref="/dashboard/meetings" />
      <h1 className="mt-3 text-balance text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
        Start a New Meeting
      </h1>
      <p className="mt-1 text-pretty text-sm leading-relaxed text-muted">
        Paste your Google Meet link. The 8xMeetly bot joins, records, and writes
        the notes for you.
      </p>

      <Card className="mt-6 p-6 sm:p-7">
        <form className="space-y-5" onSubmit={onSubmit}>
          <Field
            label="Meeting URL"
            htmlFor="meeting-url"
            error={urlError}
            hint="Google Meet only in this version. Zoom and Teams arrive in V2."
          >
            <Input
              id="meeting-url"
              name="meeting-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              required
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij…"
            />
          </Field>
          <Field label="Bot Name" htmlFor="bot-name">
            <Input
              id="bot-name"
              name="bot-name"
              type="text"
              autoComplete="off"
              maxLength={100}
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="8xMeetly Notetaker…"
            />
          </Field>
          <FormStatus error={error} />
          <Button type="submit" size="pill" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />
                Joining…
              </>
            ) : (
              <>
                Join Meeting
                <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
