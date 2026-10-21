"use client";
import { ListingCard } from "@/components/listing-card";
import { useSaved } from "@/components/save-button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function SavedPage() {
  const { data: session, isPending } = authClient.useSession();
  const saved = useSaved();

  if (isPending) return <p>Loading…</p>;
  if (!session) return <p><Link href="/login" className="underline">Sign in</Link> to see saved listings.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved listings</h1>
      {saved.isLoading ? <p>Loading…</p> : saved.data?.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.data.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : <p>Nothing saved yet.</p>}
    </div>
  );
}
