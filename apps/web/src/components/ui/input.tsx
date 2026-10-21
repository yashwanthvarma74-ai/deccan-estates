import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-sm border border-[#ddd] bg-white px-3 text-[15px] text-ink placeholder:text-ink-faint focus-visible:shadow-soft",
        className,
      )}
      {...props}
    />
  );
}
