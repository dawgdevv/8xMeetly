"use client";

import { useSearchParams } from "next/navigation";

export function OAuthNotice() {
  const params = useSearchParams();
  if (params.get("error") !== "oauth_failed") return null;
  return (
    <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-3 text-center text-sm font-medium text-red-700 ring-1 ring-red-200">
      Google sign-in failed. Try again or use email instead.
    </p>
  );
}
