"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatInr } from "@/lib/utils";
import { type Listing, typeLabels } from "@/lib/api";

/** Corner-bracket "viewfinder" marker used beside the Prev / Next controls. */
function Brackets({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M1 7V1h6M17 1h6v6M23 17v6h-6M7 23H1v-6" />
    </svg>
  );
}

export function FeatureSlider({ items }: { items: Listing[] }) {
  const [i, setI] = useState(0);
  const n = items.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);
  const l = items[i];
  if (!l) return null;

  return (
    <div className="grid items-center gap-10 md:grid-cols-[1fr_minmax(0,26rem)_1fr]" aria-roledescription="carousel" aria-label="Featured properties">
      <div className="order-2 flex items-center justify-center gap-6 md:order-1 md:justify-end">
        <button onClick={() => go(-1)} className="label flex cursor-pointer items-center gap-3 hover:opacity-60" aria-label="Previous property">
          Prev. <Brackets className="h-5 w-5" />
        </button>
      </div>

      <Link href={`/listings/${l.id}`} className="group order-1 block md:order-2" key={l.id}>
        <div className="relative aspect-[3/4] overflow-hidden bg-surface">
          <Image src={l.imageUrl} alt={l.title} fill sizes="(min-width:768px) 26rem, 90vw" className="animate-[hero-in_700ms_ease-out_both] object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
            <p className="label text-[0.6rem] text-white/80">{typeLabels[l.type]} · {l.locality.name}</p>
            <p className="mt-1 text-xl font-light">{formatInr(l.priceInr)}</p>
          </div>
        </div>
      </Link>

      <div className="order-3 flex flex-col items-center gap-5 md:items-start">
        <button onClick={() => go(1)} className="label flex cursor-pointer items-center gap-3 hover:opacity-60" aria-label="Next property">
          <Brackets className="h-5 w-5" /> Next.
        </button>
        <div className="hidden max-w-[16rem] md:block">
          <p className="text-[13px] leading-relaxed text-body">{l.title}. {l.areaSqft} sq ft{l.bedrooms ? `, ${l.bedrooms} bedrooms` : ""}. RERA {l.reraNumber ?? "pending"}.</p>
          <Link href={`/listings/${l.id}`} className="label mt-4 inline-block border-b border-ink pb-0.5 hover:opacity-60">View listing ↗</Link>
        </div>
        <p className="label text-muted tabular-nums">{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</p>
      </div>
    </div>
  );
}
