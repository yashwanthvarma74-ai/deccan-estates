import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-lg border border-line bg-card px-4 text-sm text-ink placeholder:text-muted focus-visible:border-white/60",
        className,
      )}
      {...props}
    />
  );
}
