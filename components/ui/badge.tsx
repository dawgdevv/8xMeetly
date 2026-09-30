import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleDashed,
  Cpu,
  LoaderCircle,
  Radio,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const STATUS_META: Record<string, { label: string; icon: LucideIcon; classes: string }> = {
  scheduled: { label: "Scheduled", icon: Clock, classes: "bg-stone-100 text-stone-600" },
  joining: { label: "Joining", icon: LoaderCircle, classes: "bg-amber-100 text-amber-800" },
  in_progress: { label: "Recording", icon: Radio, classes: "bg-red-100 text-red-700" },
  processing: { label: "Processing", icon: Cpu, classes: "bg-sky-100 text-sky-800" },
  completed: { label: "Completed", icon: CheckCircle2, classes: "bg-green-100 text-green-800" },
  failed: { label: "Failed", icon: XCircle, classes: "bg-red-100 text-red-700" },
};

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

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "default" && "bg-stone-100 text-stone-600",
        tone === "green" && "bg-green-100 text-green-800",
        tone === "amber" && "bg-amber-100 text-amber-800",
        tone === "red" && "bg-red-100 text-red-700",
        tone === "blue" && "bg-sky-100 text-sky-800",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    icon: CircleDashed,
    classes: "bg-stone-100 text-stone-600",
  };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold",
        meta.classes
      )}
    >
      <Icon
        size={13}
        strokeWidth={2.5}
        aria-hidden="true"
        className={status === "joining" ? "animate-spin" : undefined}
      />
      {meta.label}
    </span>
  );
}
