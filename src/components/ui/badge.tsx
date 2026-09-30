import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "default" && "bg-card border border-border text-muted",
        tone === "green" && "bg-green-500/10 text-green-500",
        tone === "amber" && "bg-amber-500/10 text-amber-500",
        tone === "red" && "bg-red-500/10 text-red-500",
        tone === "blue" && "bg-primary/10 text-primary",
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): "default" | "green" | "amber" | "red" | "blue" {
  switch (status) {
    case "completed":
      return "green";
    case "failed":
      return "red";
    case "in_progress":
      return "blue";
    case "joining":
    case "processing":
      return "amber";
    default:
      return "default";
  }
}
