"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };

const tabs = [
  { label: "Buy", href: null },
  { label: "Rent", href: null, disabled: true },
  { label: "Developments", href: "/listings?type=GATED_COMMUNITY" },
  { label: "Sell", href: "/sell" },
  { label: "More", href: "/stories" },
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
    <section className="bg-navy text-white" aria-label="Find a home">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-2 md:gap-16">
        <h1 className="font-display text-4xl leading-[1.15] md:text-5xl">Find a home that suits your lifestyle.</h1>
        <div>
          <ul className="flex flex-wrap gap-x-8 gap-y-2" role="tablist" aria-label="What are you looking for">
            {tabs.map((t) => {
              const active = t.label === "Buy";
              const cls = cn(
                "label inline-block border-b-2 pb-1 text-[0.75rem]",
                active ? "border-gold" : "border-transparent",
                t.disabled && "cursor-not-allowed text-white/40",
              );
              return (
                <li key={t.label} role="presentation">
                  {t.href ? (
                    <Link href={t.href} className={cn(cls, "hover:border-white/60")}>{t.label}</Link>
                  ) : (
                    <span role="tab" aria-selected={active} aria-disabled={t.disabled} title={t.disabled ? "Rentals coming soon" : undefined} className={cls}>
                      {t.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <form onSubmit={submit} role="search" className="mt-6 flex items-center gap-3 border-b border-white/70 pb-2 focus-within:border-white">
            <Search className="h-5 w-5 shrink-0" aria-hidden />
            <input
              list="band-localities"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search by locality or keyword"
              aria-label="Search by locality or keyword"
              className="font-display w-full bg-transparent text-2xl outline-none placeholder:text-white/60"
            />
            <datalist id="band-localities">
              {localities.map((l) => <option key={l.id} value={l.name} />)}
            </datalist>
            <button type="submit" aria-label="Search" className="cursor-pointer"><ArrowRight className="h-6 w-6" /></button>
          </form>
        </div>
      </div>
    </section>
  );
}
