import { cn } from "@/lib/utils";

// 8x mark: black rounded box, white "8x" — paired with the Meetly wordmark.
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      translate="no"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0b0b0c] text-[15px] font-extrabold tracking-tighter text-white"
      >
        8x
      </span>
      {!compact && (
        <span className="text-[19px] font-extrabold tracking-tight text-ink">
          Meetly
        </span>
      )}
    </span>
  );
}
