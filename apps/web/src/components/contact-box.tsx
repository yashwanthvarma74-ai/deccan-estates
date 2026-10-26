"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authedFetch } from "@/components/save-button";

type Agent = { name: string; phone: string; reraId: string };

/**
 * Who to call. An agent's number is public; a private owner's number is only shown to signed-in people,
 * so it cannot be scraped from the page.
 */
export function ContactBox({ listingId, agent, owner }: { listingId: string; agent: Agent | null; owner: { name: string } | null }) {
  const { data: session, isPending } = authClient.useSession();
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const btn = "mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-white font-medium text-bg transition-colors hover:bg-white/90";

  if (agent) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6">
        <p className="label text-muted">Listing agent</p>
        <p className="mt-2 text-2xl font-semibold">{agent.name}</p>
        <p className="mt-1 text-sm text-muted">RERA agent ID {agent.reraId}</p>
        <a href={`tel:${agent.phone.replace(/\s/g, "")}`} className={btn}>Call {agent.phone}</a>
      </div>
    );
  }

  async function reveal() {
    setError(null);
    try {
      const c = (await authedFetch(`/listings/${listingId}/contact`)) as { phone: string };
      setPhone(c.phone);
    } catch {
      setError("Could not load the number. Please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="label text-muted">Posted by the owner</p>
      <p className="mt-2 text-2xl font-semibold">{owner?.name ?? "Owner"}</p>
      <p className="mt-1 text-sm text-muted">Deccan Estates has not verified this person or the papers yet.</p>
      {phone ? (
        <a href={`tel:${phone.replace(/\s/g, "")}`} className={btn}>Call {phone}</a>
      ) : session ? (
        <button onClick={reveal} className={`${btn} cursor-pointer`}>Show phone number</button>
      ) : (
        <Link href={`/login?next=/listings/${listingId}`} className={btn} aria-disabled={isPending}>Sign in to see the number</Link>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
