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

/** Tall locality card: 3:4 photo, rounded corners, name and a boxed arrow link line. */
export function DestinationCard({ name, slug, count, image }: { name: string; slug: string; count: number; image: string }) {
  return (
    <Link href={`/listings?locality=${slug}`} className="group relative aspect-[3/4] w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[46%] lg:w-[calc((100%-2rem)/3)]">
      <Image src={image} alt="" fill sizes="(min-width:1024px) 24vw, 70vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
      {/* Cool navy-teal grade so every photo sits in the same colour family. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_60_90/0.18)_0%,transparent_38%,rgb(5_10_30/0.8)_100%)]" />
      <div className="absolute inset-x-6 bottom-6 text-white">
        <p className="text-2xl font-semibold">{name}</p>
        <p className="mt-2 flex items-center gap-3 text-[15px] text-white/80">
          <span className="whitespace-nowrap">Included <u className="font-medium text-white underline-offset-2">{count} homes</u></span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/70 transition-colors group-hover:bg-white group-hover:text-bg"><ArrowUpRight className="h-4 w-4" /></span>
        </p>
      </div>
    </Link>
  );
}

/** Landscape service card: photo with an icon chip, then a two-weight title below ("Bold start, light end"). */
export function ServiceCard({ title, text, image, icon }: { title: string; text: string; image: string; icon: React.ReactNode }) {
  const [first, ...rest] = title.split(" ");
  return (
    <article className="group w-[86%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-card">
        <Image src={image} alt="" fill sizes="(min-width:1024px) 28vw, 80vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_60_90/0.12),transparent_45%,rgb(5_10_30/0.55))]" />
        <span className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/50 bg-bg/40 text-white backdrop-blur">{icon}</span>
      </div>
      <h3 className="mt-4 text-[clamp(1.4rem,2.2vw,1.9rem)] leading-tight text-white"><b className="font-semibold">{first}</b> <span className="font-light">{rest.join(" ")}</span></h3>
      <p className="mt-1.5 max-w-sm text-[15px] text-body">{text}</p>
    </article>
  );
}
