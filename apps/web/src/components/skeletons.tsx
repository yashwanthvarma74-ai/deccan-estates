import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse bg-card", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="border border-line bg-card" aria-hidden>
      <Skeleton className="aspect-[3/2] w-full" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading homes" className={cn("grid gap-6 sm:grid-cols-2", className)}>
      {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
