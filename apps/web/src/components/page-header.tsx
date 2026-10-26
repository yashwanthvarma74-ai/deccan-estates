import type { ReactNode } from "react";

/** Shared opening for inner pages: mono eyebrow, large tight headline, one calm paragraph. */
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mx-auto max-w-[1320px] px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
      <p className="mono-label flex items-center gap-3 text-white/60"><span className="h-px w-8 bg-[#b6f400]" />{eyebrow}</p>
      <h1 className="mt-5 max-w-[18ch] text-[clamp(2.4rem,5.4vw,4.8rem)] font-normal leading-[1] tracking-[-0.055em] text-white">{title}</h1>
      {children && <div className="mt-5 max-w-[56ch] text-[1.1rem] leading-snug text-white/65">{children}</div>}
    </header>
  );
}
