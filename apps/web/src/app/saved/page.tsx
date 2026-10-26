"use client";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { PageHeader } from "@/components/page-header";
import { useSaved } from "@/components/save-button";
import { authClient } from "@/lib/auth-client";

const cta = "mono-label inline-flex h-12 items-center rounded-lg bg-[#b6f400] px-7 text-black transition-transform hover:scale-[1.03]";

export default function SavedPage() {
  const { data: session, isPending } = authClient.useSession();
  const saved = useSaved();

  return (
    <>
      <PageHeader eyebrow="Saved homes" title="Your shortlist.">Homes you starred are kept here so you can compare them and come back.</PageHeader>
      <section className="mx-auto max-w-[1320px] px-5 pb-24 sm:px-8">
        {isPending || (session && saved.isLoading) ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/[0.06]" />)}</div>
        ) : !session ? (
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-10"><p className="text-[1.3rem] tracking-[-0.02em]">Sign in to see the homes you saved.</p><Link href="/login" className={`${cta} mt-6`}>Sign in</Link></div>
        ) : saved.data?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{saved.data.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        ) : (
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-10"><p className="text-[1.3rem] tracking-[-0.02em]">Nothing saved yet. Tap the star on any home to keep it here.</p><Link href="/listings" className={`${cta} mt-6`}>Search homes</Link></div>
        )}
      </section>
    </>
  );
}
