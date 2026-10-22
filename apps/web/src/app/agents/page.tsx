import { Suspense } from "react";
import { z } from "zod";
import { API_URL } from "@/lib/api";

const agents = z.array(z.object({ id: z.string(), name: z.string(), phone: z.string(), reraId: z.string(), listingCount: z.number() }));

async function Agents() {
  const res = await fetch(`${API_URL}/agents`, { next: { revalidate: 300 } });
  const list = agents.parse(await res.json());
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((a) => (
        <article key={a.id} className="border border-line p-6">
          <p className="font-display text-2xl">{a.name}</p>
          <p className="label mt-2 text-[0.7rem] text-muted">RERA {a.reraId}</p>
          <p className="mt-4 text-sm">{a.listingCount} active listings</p>
          <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="label mt-4 inline-block text-navy underline underline-offset-4">{a.phone}</a>
        </article>
      ))}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-[1800px] px-6 py-16">
      <h1 className="text-5xl">Our agents</h1>
      <p className="mt-3 max-w-2xl text-muted">RERA-registered agents who list and manage properties across Hyderabad.</p>
      <Suspense fallback={<p className="mt-10 text-muted">Loading…</p>}><Agents /></Suspense>
    </div>
  );
}
