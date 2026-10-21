"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };

const tabs = [
  { label: "Buy", href: null },
  { label: "Rent", href: null, disabled: true },
  { label: "Developments", href: "/listings?type=GATED_COMMUNITY" },
  { label: "Sell", href: "/sell" },
  { label: "More", href: "/stories" },
];

/** Decorative sticker constellation: colour carries personality, never structure. */
const stickers = [
  { c: "bg-accent-pink", s: "h-10 w-10", p: "left-[6%] top-[22%]", r: "-rotate-12" },
  { c: "bg-accent-orange", s: "h-7 w-7", p: "left-[14%] bottom-[18%]", r: "rotate-6" },
  { c: "bg-accent-teal", s: "h-9 w-9", p: "right-[8%] top-[18%]", r: "rotate-12" },
  { c: "bg-accent-purple", s: "h-12 w-12", p: "right-[16%] bottom-[14%]", r: "-rotate-6" },
  { c: "bg-accent-sky", s: "h-6 w-6", p: "left-[42%] top-[8%]", r: "rotate-45" },
  { c: "bg-accent-green", s: "h-6 w-6", p: "right-[34%] bottom-[10%]", r: "-rotate-12" },
];

export function SearchBand({ localities }: { localities: Locality[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    const match = localities.find((l) => l.name.toLowerCase() === text.toLowerCase());
    const params = new URLSearchParams();
    if (match) params.set("locality", match.slug);
    else if (text) params.set("q", text);
    router.push(`/listings?${params}`);
  }

  return (
    <section className="relative isolate overflow-hidden bg-secondary text-white" aria-label="Find a home">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        {stickers.map((s, i) => (
          <span key={i} className={cn("absolute rounded-xl opacity-90 shadow-soft", s.c, s.s, s.p, s.r)} />
        ))}
      </div>
      <div className="mx-auto max-w-[1300px] px-6 py-20 text-center md:py-24">
        <h1 className="mx-auto max-w-3xl text-5xl md:text-[64px] md:leading-none md:tracking-[-2.125px]">
          Find a home that suits your lifestyle.
        </h1>
        <ul className="mt-9 flex flex-wrap justify-center gap-2" role="tablist" aria-label="What are you looking for">
          {tabs.map((t) => {
            const active = t.label === "Buy";
            const cls = cn(
              "label inline-block rounded-full px-4 py-1.5",
              active ? "bg-white text-secondary" : "text-white/80",
              t.disabled && "cursor-not-allowed text-white/40",
            );
            return (
              <li key={t.label} role="presentation">
                {t.href ? (
                  <Link href={t.href} className={cn(cls, "hover:bg-white/10")}>{t.label}</Link>
                ) : (
                  <span role="tab" aria-selected={active} aria-disabled={t.disabled} title={t.disabled ? "Rentals coming soon" : undefined} className={cls}>
                    {t.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <form onSubmit={submit} role="search" className="mx-auto mt-5 flex max-w-xl items-center gap-3 rounded-xl bg-white p-2 shadow-elevated">
          <Search className="ml-2 h-5 w-5 shrink-0 text-ink-faint" aria-hidden />
          <input
            list="band-localities"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search by locality or keyword"
            aria-label="Search by locality or keyword"
            className="h-11 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
          />
          <datalist id="band-localities">
            {localities.map((l) => <option key={l.id} value={l.name} />)}
          </datalist>
          <button type="submit" className="label h-11 shrink-0 cursor-pointer rounded-full bg-primary px-6 text-white transition-transform hover:bg-primary-active active:scale-95">
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
