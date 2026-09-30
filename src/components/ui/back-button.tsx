"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({
  label = "Back",
  fallbackHref,
}: {
  label?: string;
  fallbackHref: string;
}) {
  const router = useRouter();

  function goBack() {
    // Direct visits (shared link, refresh) have no history — fall back instead.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-stone-500 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
      {label}
    </button>
  );
}
