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
      <nav className="label mb-6 text-muted" aria-label="Breadcrumb">
        <Link href="/listings" className="hover:text-navy">Homes for sale</Link> /{" "}
        <Link href={`/listings?locality=${listing.locality.slug}`} className="hover:text-navy">{listing.locality.name}</Link>
      </nav>
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <Image src={listing.imageUrl} alt={listing.title} width={1400} height={900} priority className="h-full max-h-[34rem] w-full object-cover" />
        <div className="hidden gap-2 md:grid">
          {extra.map((src) => <Image key={src} src={src} alt="" width={700} height={450} className="h-full max-h-[16.8rem] w-full object-cover" />)}
        </div>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="label text-muted">{typeLabels[listing.type]} · {listing.locality.name}</p>
          <h1 className="mt-3 text-4xl md:text-5xl">{listing.title}</h1>
          <p className="font-display mt-1 text-xl text-muted">{listing.locality.name}, Hyderabad, Telangana</p>
          <p className="mt-6 text-3xl font-semibold">{formatInr(listing.priceInr)}</p>
          <dl className="mt-8 grid grid-cols-2 border-y border-line md:grid-cols-4">
            {specs.map(([k, v]) => (
              <div key={k} className="py-5 pr-4">
                <dt className="label text-[0.7rem] text-muted">{k}</dt>
                <dd className="font-display mt-1 text-xl">{v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-10 text-2xl">About this property</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{listing.description}</p>
          <p className="label mt-8 text-muted">RERA No. {listing.reraNumber ?? "—"}</p>
          <div className="mt-8"><SaveButton listingId={listing.id} /></div>
        </div>

        <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <div className="border border-line p-6">
            <p className="label text-muted">Listing agent</p>
            <p className="font-display mt-2 text-2xl">{listing.agent.name}</p>
            <p className="mt-1 text-sm text-muted">RERA agent ID {listing.agent.reraId}</p>
            <a href={`tel:${listing.agent.phone.replace(/\s/g, "")}`} className="label mt-4 inline-flex h-12 w-full items-center justify-center bg-navy text-white hover:bg-navy-deep">
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
    <Suspense fallback={<p className="p-10 text-muted">Loading…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
