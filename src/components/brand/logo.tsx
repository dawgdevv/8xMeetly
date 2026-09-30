import { AudioWaveform } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white"
      >
        <AudioWaveform size={17} strokeWidth={2.5} />
      </span>
      {!compact && (
        <span
          translate="no"
          className="text-[19px] font-extrabold tracking-tight text-ink"
        >
          8xMeetly
        </span>
      )}
    </span>
  );
}
