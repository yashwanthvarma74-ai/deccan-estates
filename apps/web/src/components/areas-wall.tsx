import Link from "next/link";

/** Wordmark wall: each area is one cell of a hairline grid with crosshair marks at the joints. */
export function AreasWall({ areas }: { areas: { name: string; slug: string; count: number }[] }) {
  const style = ["font-semibold tracking-[-0.03em]", "font-medium uppercase tracking-[0.12em] text-[1.15rem]", "font-light tracking-[-0.04em]", "font-semibold uppercase tracking-[0.04em] text-[1.25rem]", "font-normal italic tracking-[-0.02em]"];
  return (
    <div className="relative mx-auto mt-16 max-w-[1320px]" role="list" aria-label="Areas we cover">
      <div className="grid grid-cols-2 border-l border-t border-paper-ink/12 md:grid-cols-5">
        {areas.map((a, i) => (
          <Link key={a.slug} role="listitem" href={`/listings?locality=${a.slug}`} className="group relative flex h-36 flex-col items-center justify-center gap-2 border-b border-r border-paper-ink/12 px-3 text-center text-paper-ink transition-colors hover:bg-paper-ink hover:text-white">
            <span aria-hidden className="absolute -right-[5px] -top-[7px] text-[11px] leading-none text-paper-ink/45">+</span>
            <span aria-hidden className="absolute -bottom-[7px] -right-[5px] text-[11px] leading-none text-paper-ink/45">+</span>
            <span className={`text-[1.7rem] leading-none ${style[i % style.length]}`}>{a.name}</span>
            <span className="mono-label text-paper-ink/45 transition-colors group-hover:text-[#b6f400]">{a.count} homes</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
