import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Assistant } from "@/components/assistant";
import { SaveButton } from "@/components/save-button";
import { typeLabels } from "@/lib/api";
import { getListing } from "@/lib/data";
import { formatInr } from "@/lib/utils";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id).catch(() => null);
  if (!listing) notFound();
  const extra = [1, 2].map((n) => listing.imageUrl.replace(/\/seed\/([^/]+)/, `/seed/$1-${n}`));
  const specs: [string, string][] = [
    ["Price", formatInr(listing.priceInr)],
    ["Area", `${listing.areaSqft} Sq Ft.`],
    ["Per sq ft", `₹${Math.round(listing.priceInr / listing.areaSqft).toLocaleString("en-IN")}`],
    ["Bedrooms", listing.bedrooms ? String(listing.bedrooms) : "—"],
  ];

  return (
    <div className="mx-auto max-w-[1800px] px-6 py-8">
      <nav className="mb-6 text-sm text-ink-muted" aria-label="Breadcrumb">
        <Link href="/listings" className="hover:text-primary">Homes for sale</Link> /{" "}
        <Link href={`/listings?locality=${listing.locality.slug}`} className="hover:text-primary">{listing.locality.name}</Link>
      </nav>
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <Image src={listing.imageUrl} alt={listing.title} width={1400} height={900} priority className="h-full max-h-[34rem] w-full rounded-xl object-cover" />
        <div className="hidden gap-2 md:grid">
          {extra.map((src) => <Image key={src} src={src} alt="" width={700} height={450} className="h-full max-h-[16.8rem] w-full rounded-xl object-cover" />)}
        </div>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="eyebrow inline-block rounded-full bg-white px-2 py-1 text-primary">{typeLabels[listing.type]} · {listing.locality.name}</p>
          <h1 className="mt-3 text-4xl md:text-[54px] md:tracking-[-1.875px]">{listing.title}</h1>
          <p className="mt-2 text-lg text-ink-muted">{listing.locality.name}, Hyderabad, Telangana</p>
          <p className="mt-6 text-3xl font-bold tracking-tight">{formatInr(listing.priceInr)}</p>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-4">
            {specs.map(([k, v]) => (
              <div key={k} className="bg-white p-5">
                <dt className="text-sm text-ink-muted">{k}</dt>
                <dd className="mt-1 text-xl font-bold tracking-tight">{v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-10 text-[26px] tracking-[-0.625px]">About this property</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-muted">{listing.description}</p>
          <p className="mt-8 text-sm text-ink-muted">RERA No. {listing.reraNumber ?? "—"}</p>
          <div className="mt-8"><SaveButton listingId={listing.id} /></div>
        </div>

        <div className="space-y-8">
          <div className="rounded-xl border border-hairline bg-white p-6">
            <p className="text-sm text-ink-muted">Listing agent</p>
            <p className="mt-1 text-[22px] font-bold tracking-tight">{listing.agent.name}</p>
            <p className="mt-1 text-sm text-ink-muted">RERA agent ID {listing.agent.reraId}</p>
            <a href={`tel:${listing.agent.phone.replace(/\s/g, "")}`} className="label mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-white transition-transform hover:bg-primary-active active:scale-95">
              Call {listing.agent.phone}
            </a>
          </div>
          <Assistant listingId={listing.id} />
        </div>
      </div>
    </div>
  );
}

export default function ListingPage({ params }: PageProps<"/listings/[id]">) {
  return (
    <Suspense fallback={<p className="p-10 text-ink-muted">Loading…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
