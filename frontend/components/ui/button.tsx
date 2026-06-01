import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded border border-transparent font-sans font-bold tracking-tight uppercase text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-[10px]",
        size === "md" && "h-10 px-4 text-xs",
        size === "lg" && "h-11 px-5 text-sm",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "border-border bg-card text-foreground hover:bg-muted hover:border-muted-foreground/30",
        variant === "outline" && "border-primary text-primary bg-transparent hover:bg-primary/5",
        variant === "ghost" && "text-foreground/80 hover:bg-muted hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
