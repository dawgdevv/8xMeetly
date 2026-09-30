import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

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
      <body className={`${figtree.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
