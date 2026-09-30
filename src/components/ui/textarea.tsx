import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
        "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
      {...props}
    />
  );
}
