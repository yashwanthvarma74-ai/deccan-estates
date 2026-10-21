import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("eyebrow rounded-full bg-white px-2 py-1 text-primary", className)} {...props} />;
}
