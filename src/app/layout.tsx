import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meetly AI — Never take meeting notes again",
  description:
    "Meetly joins your Google Meet calls, records, transcribes, and turns meetings into summaries, decisions, and action items.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
