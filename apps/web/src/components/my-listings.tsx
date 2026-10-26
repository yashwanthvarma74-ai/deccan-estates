"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { listingSchema, typeLabels } from "@/lib/api";
import { authedRequest } from "@/lib/authed";
import { DEAL_TAGS, priceLabel, type Deal } from "@/lib/utils";

const STATUS: Record<string, string> = { ACTIVE: "Live", DRAFT: "Paused", SOLD: "Closed" };
const closedLabel = (d: string) => (d === "SALE" ? "Mark as sold" : d === "RENT" ? "Mark as rented" : "Mark as leased");

export function MyListings() {
  const { data: session, isPending } = authClient.useSession();
  const qc = useQueryClient();
  const router = useRouter();
  const mine = useQuery({
    queryKey: ["mine"],
    enabled: !!session,
    queryFn: async () => z.array(listingSchema).parse(await authedRequest("/me/listings")),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["mine"] });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => authedRequest(`/me/listings/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => authedRequest(`/me/listings/${id}`, { method: "DELETE" }), onSuccess: refresh });

  if (isPending) return <p className="px-8 pb-24 text-white/70">Loading…</p>;
  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 text-center">
        <p className="text-white/75">Sign in to see the properties you have posted.</p>
        <Link href="/login?next=/account" className="mono-label mt-6 inline-flex h-12 items-center rounded-lg bg-[#b6f400] px-7 text-black">Log in or sign up</Link>
      </div>
    );
  }

  const list = mine.data ?? [];
  const error = (setStatus.error ?? remove.error ?? mine.error) as Error | null;

  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-white/75">Signed in as {session.user.email}</p>
        <div className="flex gap-3">
          <Link href="/post" className="mono-label flex h-11 items-center rounded-lg bg-[#b6f400] px-6 text-black">Post a property</Link>
          <button onClick={() => authClient.signOut().then(() => { router.push("/"); router.refresh(); })} className="mono-label h-11 cursor-pointer rounded-lg border border-white/25 px-6 text-white/85 hover:text-white">Log out</button>
        </div>
      </div>
      {error && <p role="alert" className="mb-6 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">{error.message}</p>}
      {mine.isLoading ? (
        <p className="text-white/70">Loading your listings…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-10 text-center">
          <h2 className="text-[1.6rem] tracking-[-0.03em]">You have not posted anything yet</h2>
          <p className="mt-2 text-white/70">Posting takes a few minutes and is free.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {list.map((l) => (
            <li key={l.id} className="grid gap-5 rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:grid-cols-[220px_1fr] sm:p-5">
              <Link href={`/listings/${l.id}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-white/10">
                <Image src={l.imageUrl} alt={l.title} fill sizes="220px" className="object-cover" />
              </Link>
              <div className="flex flex-col">
                <p className="mono-label text-[#b6f400]">{DEAL_TAGS[l.dealType as Deal]} · {typeLabels[l.type]} · {l.locality.name}</p>
                <h3 className="mt-2 text-[1.35rem] leading-tight tracking-[-0.02em]"><Link href={`/listings/${l.id}`} className="hover:underline">{l.title}</Link></h3>
                <p className="mt-1 text-lg">{priceLabel(l)} <span className="ml-2 rounded-full border border-white/25 px-3 py-0.5 align-middle text-xs text-white/80">{STATUS[l.status ?? "ACTIVE"]}</span></p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {l.status === "ACTIVE" ? (
                    <button onClick={() => setStatus.mutate({ id: l.id, status: "DRAFT" })} className="cursor-pointer rounded-lg border border-white/25 px-4 py-2 text-sm hover:bg-white/10">Pause</button>
                  ) : (
                    <button onClick={() => setStatus.mutate({ id: l.id, status: "ACTIVE" })} className="cursor-pointer rounded-lg border border-white/25 px-4 py-2 text-sm hover:bg-white/10">Make live again</button>
                  )}
                  {l.status !== "SOLD" && <button onClick={() => setStatus.mutate({ id: l.id, status: "SOLD" })} className="cursor-pointer rounded-lg border border-white/25 px-4 py-2 text-sm hover:bg-white/10">{closedLabel(l.dealType)}</button>}
                  <button onClick={() => confirm("Delete this listing and its photos? This cannot be undone.") && remove.mutate(l.id)} className="cursor-pointer rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-200 hover:bg-red-400/10">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
