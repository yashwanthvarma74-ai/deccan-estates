/** Original wordmark: a ring emblem with a roofline cut, beside a spaced wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg aria-hidden viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="16" cy="16" r="14.5" />
        <path d="M8 19.5 16 11l8 8.5M11.5 19.5V24h9v-4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="leading-none">
        <span className="block text-[1.35rem] font-semibold tracking-[0.04em]">DECCAN</span>
        <span className="mt-1 block text-[0.52rem] font-medium tracking-[0.42em] opacity-70">ESTATES</span>
      </span>
    </span>
  );
}
