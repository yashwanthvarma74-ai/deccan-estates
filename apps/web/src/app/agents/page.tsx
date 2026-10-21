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
        <article key={a.id} className="rounded-xl border border-hairline bg-white p-6">
          <p className="text-[22px] font-bold tracking-tight">{a.name}</p>
          <p className="eyebrow mt-2 text-ink-muted">RERA {a.reraId}</p>
          <p className="mt-4 text-sm">{a.listingCount} active listings</p>
          <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">{a.phone}</a>
        </article>
      ))}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-[1800px] px-6 py-16">
      <h1 className="text-[54px] tracking-[-1.875px]">Our agents</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">RERA-registered agents who list and manage properties across Hyderabad.</p>
      <Suspense fallback={<p className="mt-10 text-ink-muted">Loading…</p>}><Agents /></Suspense>
    </div>
  );
}
