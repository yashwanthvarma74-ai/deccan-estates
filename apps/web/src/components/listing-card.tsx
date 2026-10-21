"use client";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInr, cn } from "@/lib/utils";
import { type Listing, typeLabels } from "@/lib/api";
import { useCompare } from "@/stores/compare";

export function ListingCard({ listing }: { listing: Listing }) {
  const comparing = useCompare((s) => s.ids.includes(listing.id));
  const toggle = useCompare((s) => s.toggle);

  return (
    <article className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <Link href={`/listings/${listing.id}`}>
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          width={800}
          height={600}
          className="aspect-[4/3] w-full object-cover"
        />
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <Badge>{typeLabels[listing.type]}</Badge>
          <span className="text-xs text-neutral-500">{listing.locality.name}</span>
        </div>
        <h3 className="font-medium leading-snug">
          <Link href={`/listings/${listing.id}`} className="hover:underline">{listing.title}</Link>
        </h3>
        <p className="text-lg font-semibold">{formatInr(listing.priceInr)}</p>
        <p className="text-sm text-neutral-500">
          {listing.areaSqft} sq ft{listing.bedrooms ? ` · ${listing.bedrooms} BHK` : ""}
        </p>
        <Button
          variant="outline"
          size="sm"
          className={cn(comparing && "border-emerald-700 text-emerald-800")}
          onClick={() => toggle(listing.id)}
          aria-pressed={comparing}
        >
          {comparing ? "Remove from compare" : "Compare"}
        </Button>
      </div>
    </article>
  );
}
