import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { API_URL } from "@/lib/api";

export const metadata: Metadata = { title: "Our agents", description: "RERA-registered agents who list and manage properties across Hyderabad." };

const agents = z.array(z.object({ id: z.string(), name: z.string(), phone: z.string(), reraId: z.string(), listingCount: z.number() }));

async function Agents() {
  const res = await fetch(`${API_URL}/agents`, { next: { revalidate: 300 } });
  const list = agents.parse(await res.json());
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((a) => (
        <li key={a.id} className="flex flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-7 transition-colors hover:border-white/30">
          <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-[#b6f400] text-lg font-semibold text-black">{a.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
          <p className="mt-6 text-[1.6rem] leading-none tracking-[-0.03em]">{a.name}</p>
          <p className="mono-label mt-3 text-white/45">RERA {a.reraId}</p>
          <p className="mt-6 text-white/65">{a.listingCount} active listings</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-7">
            <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="mono-label inline-flex h-11 items-center rounded-lg bg-[#b6f400] px-5 text-black transition-transform hover:scale-[1.03]">Call</a>
            <Link href={`/listings?agent=${a.id}`} className="mono-label inline-flex h-11 items-center rounded-lg border border-white/25 px-5 text-white/85 transition-colors hover:bg-white/10">Listings</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AgentsPage() {
  return (
    <>
      <PageHeader eyebrow="Our agents" title="People who answer the phone.">Every agent is RERA-registered and shown on the listings they manage, with a direct line.</PageHeader>
      <section className="mx-auto max-w-[1320px] px-5 pb-24 sm:px-8">
        <Suspense fallback={<p className="text-white/50">Loading…</p>}><Agents /></Suspense>
      </section>
    </>
  );
}
