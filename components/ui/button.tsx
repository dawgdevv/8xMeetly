import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "ink";
  size?: "sm" | "md" | "lg" | "icon" | "pill";
}

export function Button({
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-[background-color,color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55",
        {
          "bg-primary text-primary-foreground shadow-[0_8px_16px_-9px_rgb(128_42_25/0.7)] hover:bg-primary-dark active:bg-primary-dark": variant === "default",
          "border border-border bg-card text-foreground shadow-sm hover:border-primary/40 hover:text-primary active:bg-background": variant === "outline",
          "text-foreground hover:bg-ink/[0.05] active:bg-ink/[0.08]": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-500 active:bg-red-600": variant === "destructive",
          "bg-ink text-white hover:bg-ink/90 active:bg-ink": variant === "ink",
        },
        {
          "h-9 rounded-full px-4 text-sm": size === "sm",
          "h-11 rounded-full px-5 text-sm": size === "md",
          "h-13 rounded-full px-7 py-3.5 text-base": size === "lg",
          "h-9 w-9 rounded-full": size === "icon",
          "min-h-12 rounded-2xl px-6 text-[15px]": size === "pill",
        },
        className
      )}
      {...props}
    />
  );
}

/** Dark icon chip used inside CTA buttons, echoing the reference design. */
export function ButtonChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#2b2118] text-white",
        className
      )}
    >
      {children}
    </span>
  );
}
