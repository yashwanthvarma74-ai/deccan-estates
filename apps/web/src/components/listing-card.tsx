"use client";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { formatInr, cn } from "@/lib/utils";
import { type Listing, typeLabels } from "@/lib/api";
import { useCompare } from "@/stores/compare";
import { authedFetch, useSaved } from "@/components/save-button";

export function ListingCard({ listing }: { listing: Listing }) {
  const comparing = useCompare((s) => s.ids.includes(listing.id));
  const toggleCompare = useCompare((s) => s.toggle);
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const saved = useSaved();
  const isSaved = saved.data?.some((l) => l.id === listing.id) ?? false;
  const toggleSave = useMutation({
    mutationFn: () => authedFetch(`/me/saved/${listing.id}`, { method: isSaved ? "DELETE" : "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });

  return (
    <article id={`listing-${listing.id}`} className="border border-line bg-white transition-shadow hover:shadow-md">
      <Link href={`/listings/${listing.id}`} className="relative block">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          width={800}
          height={600}
          className="aspect-[3/2] w-full object-cover"
        />
        <span className="label absolute left-3 top-3 bg-navy px-2 py-1 text-[0.65rem] text-white">
          {typeLabels[listing.type]}
        </span>
      </Link>
      <div className="relative p-5">
        <button
          aria-label={isSaved ? "Remove from saved" : "Save listing"}
          aria-pressed={isSaved}
          onClick={() => (session ? toggleSave.mutate() : router.push("/login"))}
          className="absolute right-4 top-4 cursor-pointer text-muted hover:text-navy"
        >
          <Star className={cn("h-5 w-5", isSaved && "fill-navy text-navy")} />
        </button>
        <p className="label text-[0.7rem] text-muted">{listing.locality.name}</p>
        <h3 className="font-display mt-2 pr-8 text-xl leading-snug">
          <Link href={`/listings/${listing.id}`} className="hover:underline">{listing.title}</Link>
        </h3>
        <p className="font-display text-muted">{listing.locality.name}, Hyderabad, Telangana</p>
        <p className="mt-4 font-semibold">{formatInr(listing.priceInr)}</p>
        <p className="mt-1 text-sm text-muted">
          {listing.bedrooms ? `${listing.bedrooms} Bedrooms · ` : ""}Area: {listing.areaSqft} Sq Ft.
        </p>
        <p className="font-display mt-4 text-sm italic text-muted">Marketed by {listing.agent.name}</p>
        <button
          onClick={() => toggleCompare(listing.id)}
          aria-pressed={comparing}
          className={cn("label mt-3 cursor-pointer text-[0.7rem] underline-offset-4 hover:underline", comparing ? "text-navy" : "text-muted")}
        >
          {comparing ? "✓ In compare" : "+ Compare"}
        </button>
      </div>
    </article>
  );
}
