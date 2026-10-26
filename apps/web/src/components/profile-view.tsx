"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { listingSchema } from "@/lib/api";
import { authedRequest } from "@/lib/authed";
import { firstName, useGreeting, useSignOut } from "@/components/account-menu";

function Stat({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 transition-colors hover:border-white/30">
      <p className="text-[2.6rem] leading-none tracking-[-0.04em]">{value}</p>
      <p className="mono-label mt-3 text-white/70">{label}</p>
    </Link>
  );
}

export function ProfileView() {
  const { data: session, isPending } = authClient.useSession();
  const greeting = useGreeting();
  const signOut = useSignOut();
  const mine = useQuery({ queryKey: ["mine"], enabled: !!session, queryFn: async () => z.array(listingSchema).parse(await authedRequest("/me/listings")) });
  const saved = useQuery({ queryKey: ["saved"], enabled: !!session, queryFn: async () => z.array(listingSchema).parse(await authedRequest("/me/saved")) });

  if (isPending) return <p className="px-8 pb-24 text-white/70">Loading…</p>;
  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 text-center">
        <p className="text-white/75">Sign in to see your profile.</p>
        <Link href="/login?next=/account/profile" className="mono-label mt-6 inline-flex h-12 items-center rounded-lg bg-[#b6f400] px-7 text-black">Log in or sign up</Link>
      </div>
    );
  }
  const u = session.user;
  const live = mine.data?.filter((l) => l.status === "ACTIVE").length;
  const since = u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : null;

  return (
    <section className="mx-auto max-w-[900px] px-5 pb-24 sm:px-8">
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-white/12 bg-white/[0.03] p-6 sm:p-8">
        <span aria-hidden className="flex h-20 w-20 items-center justify-center rounded-full bg-[#b6f400] text-[2rem] font-semibold uppercase text-black">{firstName(u.name, u.email)[0]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-white/70">{greeting || "Hello"},</p>
          <h2 className="truncate text-[2rem] leading-tight tracking-[-0.03em]">{u.name || firstName(u.name, u.email)}</h2>
          <p className="truncate text-white/70">{u.email}{since ? ` · member since ${since}` : ""}</p>
        </div>
        <Link href="/account/settings" className="mono-label flex h-11 items-center rounded-lg border border-white/25 px-5 text-white/90 hover:text-white">Edit details</Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Live listings" value={live ?? "…"} href="/account" />
        <Stat label="Posted in total" value={mine.data?.length ?? "…"} href="/account" />
        <Stat label="Saved homes" value={saved.data?.length ?? "…"} href="/saved" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/post" className="mono-label flex h-12 items-center rounded-lg bg-[#b6f400] px-7 text-black">Post a property</Link>
        <button onClick={signOut} className="mono-label h-12 cursor-pointer rounded-lg border border-white/25 px-7 text-white/90 hover:text-white">Log out</button>
      </div>
    </section>
  );
}
