"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { isValidMeetingUrl } from "@/lib/utils/meetings";

export default function NewMeetingPage() {
  const router = useRouter();
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botName, setBotName] = useState("Meetly Notetaker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidMeetingUrl(meetingUrl)) {
      setError("Please paste a valid Google Meet URL (https://meet.google.com/…).");
      return;
    }
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
      setError(err instanceof Error ? err.message : "Failed to create meeting.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Start a new meeting</h1>
      <p className="text-sm text-muted mb-6">
        Paste your Google Meet link — Meetly&apos;s bot will join and take notes.
      </p>
      <Card className="p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-muted block mb-1">Meeting URL</label>
            <Input
              type="url"
              required
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
            />
          </div>
          <div>
            <label className="text-sm text-muted block mb-1">Bot name</label>
            <Input value={botName} onChange={(e) => setBotName(e.target.value)} maxLength={100} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" disabled={loading}>
            {loading ? "Joining…" : "Join Meeting"}
          </Button>
        </form>
      </Card>
      <p className="text-xs text-muted mt-4">MVP supports Google Meet only. Zoom & Teams land in V2.</p>
    </div>
  );
}
