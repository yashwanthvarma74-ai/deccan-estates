import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("label bg-navy px-2 py-1 text-white", className)} {...props} />;
}
