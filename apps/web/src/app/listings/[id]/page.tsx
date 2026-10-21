import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Assistant } from "@/components/assistant";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/save-button";
import { typeLabels } from "@/lib/api";
import { getListing } from "@/lib/data";
import { formatInr } from "@/lib/utils";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id).catch(() => null);
  if (!listing) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Image src={listing.imageUrl} alt={listing.title} width={1200} height={800} className="w-full rounded-lg object-cover" priority />
        <div className="flex items-center gap-2">
          <Badge>{typeLabels[listing.type]}</Badge>
          <span className="text-sm text-neutral-500">{listing.locality.name}, Hyderabad</span>
        </div>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="text-2xl font-semibold">{formatInr(listing.priceInr)}</p>
        <p className="text-neutral-600 dark:text-neutral-400">{listing.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-neutral-500">Area</dt><dd>{listing.areaSqft} sq ft</dd></div>
          <div><dt className="text-neutral-500">RERA</dt><dd>{listing.reraNumber ?? "—"}</dd></div>
          <div><dt className="text-neutral-500">Agent</dt><dd>{listing.agent.name} · {listing.agent.phone}</dd></div>
          <div><dt className="text-neutral-500">Agent RERA ID</dt><dd>{listing.agent.reraId}</dd></div>
        </dl>
        <SaveButton listingId={listing.id} />
      </div>
      <Assistant listingId={listing.id} />
    </div>
  );
}

export default function ListingPage({ params }: PageProps<"/listings/[id]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
