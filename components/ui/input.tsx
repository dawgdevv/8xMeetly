import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(41_39_33/0.025)] transition-[border-color,box-shadow] placeholder:text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
