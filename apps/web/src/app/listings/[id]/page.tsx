import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Assistant } from "@/components/assistant";
import { SaveButton } from "@/components/save-button";
import { VerificationReport } from "@/components/verification-report";
import { typeLabels } from "@/lib/api";
import { getListing } from "@/lib/data";
import { specsFor } from "@/lib/listing-meta";
import { formatInr } from "@/lib/utils";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id).catch(() => null);
  if (!listing) notFound();
  const gallery = ["s1", "s2", "s3", "s4", "s5", "s6"].map((s) => `/stills/${s}.jpg`).filter((u) => u !== listing.imageUrl);
  const h = [...listing.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const extra = [gallery[h % gallery.length], gallery[(h + 2) % gallery.length]];
  const specs = specsFor(listing, formatInr);

  return (
    <div className="mx-auto max-w-[1800px] px-6 py-8">
      <nav className="label mb-6 text-muted" aria-label="Breadcrumb">
        <Link href="/listings" className="hover:text-white">Homes for sale</Link> /{" "}
        <Link href={`/listings?locality=${listing.locality.slug}`} className="hover:text-white">{listing.locality.name}</Link>
      </nav>
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <Image src={listing.imageUrl} alt={listing.title} width={1400} height={900} priority sizes="(min-width:768px) 66vw, 100vw" className="h-full max-h-[34rem] w-full rounded-xl object-cover" />
        <div className="hidden gap-2 md:grid">
          {extra.map((src) => <Image key={src} src={src} alt="" width={700} height={450} sizes="33vw" className="h-full max-h-[16.8rem] w-full rounded-xl object-cover" />)}
        </div>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="label text-muted">{typeLabels[listing.type]} · {listing.locality.name}</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{listing.title}</h1>
          <p className="mt-2 text-lg text-muted">{listing.locality.name}, Hyderabad, Telangana</p>
          <p className="mt-6 text-3xl font-semibold">{formatInr(listing.priceInr)}</p>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 md:grid-cols-3 xl:grid-cols-4">
            {specs.map(([k, v]) => (
              <div key={k} className="bg-card p-5">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="mt-1 text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {listing.verification && <VerificationReport report={listing.verification} isPlot={listing.type === "PLOT"} />}
          <h2 className="mt-12 text-2xl">About this property</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{listing.description}</p>
          <p className="label mt-8 text-muted">RERA No. {listing.reraNumber ?? "—"}</p>
          <div className="mt-8"><SaveButton listingId={listing.id} /></div>
        </div>

        <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="label text-muted">Listing agent</p>
            <p className="mt-2 text-2xl font-semibold">{listing.agent.name}</p>
            <p className="mt-1 text-sm text-muted">RERA agent ID {listing.agent.reraId}</p>
            <a href={`tel:${listing.agent.phone.replace(/\s/g, "")}`} className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-white font-medium text-bg transition-colors hover:bg-white/90">
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
