/** Endless horizontal ticker; content is duplicated so the loop is seamless. */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {items.map((t) => (
        <li key={t} className="px-8 text-[clamp(1.5rem,3.4vw,3rem)] font-extralight uppercase tracking-[-0.01em] text-ink">
          {t}<span aria-hidden className="ml-16 text-muted">/</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden" role="region" aria-label="Localities we cover">
      <div className="flex w-max animate-[marquee_50s_linear_infinite] hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
