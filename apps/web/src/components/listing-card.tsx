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
import { areaSummary, pricePerUnit } from "@/lib/listing-meta";
import { authedFetch, useSaved } from "@/components/save-button";
import { VerifyBadge } from "@/components/verify-badge";

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
    <article id={`listing-${listing.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_14px_40px_rgb(0_0_0/0.45)]">
      <Link href={`/listings/${listing.id}`} className="relative block overflow-hidden bg-card-hi">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          width={800}
          height={600}
          sizes="(min-width:1280px) 25vw, (min-width:640px) 45vw, 100vw"
          className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-md bg-bg/70 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          {typeLabels[listing.type]}
        </span>
        <VerifyBadge report={listing.verification} className="absolute bottom-3 left-3" />
      </Link>
      <div className="relative flex flex-1 flex-col p-5">
        <button
          aria-label={isSaved ? "Remove from saved" : "Save listing"}
          aria-pressed={isSaved}
          onClick={() => (session ? toggleSave.mutate() : router.push("/login"))}
          className="absolute right-4 top-4 cursor-pointer text-muted hover:text-white"
        >
          <Star className={cn("h-5 w-5", isSaved && "fill-white text-white")} />
        </button>
        <p className="text-xs uppercase tracking-wider text-muted">{listing.locality.name}</p>
        <h3 className="mt-2 line-clamp-2 pr-8 text-xl font-semibold leading-snug">
          <Link href={`/listings/${listing.id}`} className="hover:underline">{listing.title}</Link>
        </h3>
        <p className="text-sm text-muted">{listing.locality.name}, Hyderabad, Telangana</p>
        <p className="mt-4 text-lg font-semibold tracking-tight">{formatInr(listing.priceInr)}</p>
        <p className="mt-1 text-sm text-muted">{areaSummary(listing)}</p>
        <p className="mt-0.5 text-xs text-muted">₹{pricePerUnit(listing).value.toLocaleString("en-IN")} / {pricePerUnit(listing).unit}</p>
        <p className="mt-auto pt-4 text-sm text-muted">Marketed by {listing.agent.name}</p>
        <button
          onClick={() => toggleCompare(listing.id)}
          aria-pressed={comparing}
          className={cn("label mt-3 cursor-pointer self-start text-xs underline-offset-4 hover:underline", comparing ? "text-white" : "text-muted")}
        >
          {comparing ? "✓ In compare" : "+ Compare"}
        </button>
      </div>
    </article>
  );
}
