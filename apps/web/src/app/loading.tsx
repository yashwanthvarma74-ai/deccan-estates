export default function Loading() {
  return (
    <div className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8" role="status" aria-label="Loading">
      <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
      <div className="mt-6 h-14 w-[min(32rem,80%)] animate-pulse rounded bg-white/10" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/[0.06]" />)}</div>
    </div>
  );
}
