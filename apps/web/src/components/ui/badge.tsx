import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("label rounded-md bg-white/15 px-2 py-1 text-white backdrop-blur", className)} {...props} />;
}
