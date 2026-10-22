"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Info, MapPin, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authedFetch, useSaved } from "@/components/save-button";
import { type Listing, typeLabels } from "@/lib/api";
import { cn, formatInr } from "@/lib/utils";

/** Large photo card with locality, specs and a price in the corner. */
export function FeaturedCard({ listing, index }: { listing: Listing; index: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = authClient.useSession();
  const saved = useSaved();
  const isSaved = saved.data?.some((l) => l.id === listing.id) ?? false;
  const toggle = useMutation({
    mutationFn: () => authedFetch(`/me/saved/${listing.id}`, { method: isSaved ? "DELETE" : "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });
  const [price, unit] = formatInr(listing.priceInr).split(" ");

  return (
    <article className="group relative aspect-[4/3] w-[84%] shrink-0 snap-center overflow-hidden rounded-sm bg-card sm:w-[68%] lg:w-[66%]">
      <Image src={listing.imageUrl} alt={listing.title} fill priority={index === 0} sizes="(min-width:1024px) 66vw, 84vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
      <button
        onClick={() => (session ? toggle.mutate() : router.push("/login"))}
        aria-pressed={isSaved}
        className="absolute left-5 top-5 flex cursor-pointer items-center gap-2.5 text-sm text-white/90"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-bg"><Star className={cn("h-5 w-5", isSaved && "fill-bg")} strokeWidth={1.4} /></span>
        {isSaved ? "In favorites" : "Add to Favorites"}
      </button>
      <Link href={`/listings/${listing.id}`} className="absolute inset-0" aria-label={listing.title} />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 text-white">
        <div>
          <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{listing.locality.name}, Hyderabad</p>
          <h3 className="mt-2 text-[clamp(1.8rem,3.6vw,3rem)] font-semibold leading-none">{listing.title.split(" in ")[0]}</h3>
          <p className="mt-3 text-sm text-white/85">
            {typeLabels[listing.type]} • {listing.areaSqft} sq ft{listing.bedrooms ? ` • ${listing.bedrooms} bedrooms` : ""}
          </p>
        </div>
        <div className="flex items-end gap-4">
          <p className="text-right leading-none">
            <span className="block text-[0.65rem] text-white/70">from</span>
            <span className="text-[clamp(1.8rem,3.4vw,3rem)] font-medium">{price}</span>
            <span className="ml-1 align-top text-sm">{unit}</span>
          </p>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70"><Info className="h-4 w-4" /></span>
        </div>
      </div>
    </article>
  );
}

/** Tall locality card with a gradient and a link line. */
export function DestinationCard({ name, slug, count, image }: { name: string; slug: string; count: number; image: string }) {
  return (
    <Link href={`/listings?locality=${slug}`} className="group relative aspect-[4/5] w-[62%] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[44%] lg:w-[34%]">
      <Image src={image} alt="" fill sizes="(min-width:1024px) 20vw, 60vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute inset-x-5 bottom-5 text-white">
        <p className="text-2xl font-semibold">{name}</p>
        <p className="mt-2 flex items-center gap-3 text-sm text-white/75">
          <span className="whitespace-nowrap">Included <u className="text-white">{count} homes</u></span>
          <span className="flex h-7 w-7 items-center justify-center rounded border border-white/60 transition-colors group-hover:bg-white group-hover:text-bg"><ArrowUpRight className="h-4 w-4" /></span>
        </p>
      </div>
    </Link>
  );
}

export function ServiceCard({ title, text, image }: { title: string; text: string; image: string }) {
  return (
    <article className="group w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[40%]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-card">
        <Image src={image} alt="" fill sizes="(min-width:1024px) 22vw, 70vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-body">{text}</p>
    </article>
  );
}
