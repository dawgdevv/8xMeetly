import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "8xMeetly — Never Take Meeting Notes Again",
    template: "%s · 8xMeetly",
  },
  description:
    "8xMeetly joins your Google Meet calls, records, transcribes, and turns meetings into summaries, decisions, and action items.",
};

export const viewport: Viewport = {
  themeColor: "#faf6ef",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
