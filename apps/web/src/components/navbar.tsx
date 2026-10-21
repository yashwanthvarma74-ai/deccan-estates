"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useCompare } from "@/stores/compare";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/listings", label: "Search" },
  { href: "/listings", label: "Properties" },
  { href: "/agents", label: "Agents" },
  { href: "/stories", label: "Stories" },
];

export function Navbar() {
  const { data: session } = authClient.useSession();
  const compareCount = useCompare((s) => s.ids.length);

  return (
    <header className="bg-navy text-white">
      <div className="border-b border-white/10 bg-navy-deep">
        <div className="mx-auto flex h-12 max-w-[1800px] items-center justify-end gap-8 px-6">
          <Link href="/compare" className="label text-white/80 hover:text-white">Compare ({compareCount})</Link>
          {session ? (
            <>
              <Link href="/saved" className="label text-white/80 hover:text-white">Saved</Link>
              <button onClick={() => authClient.signOut()} className="label cursor-pointer text-white/80 hover:text-white">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="label text-white/80 hover:text-white">Join / Log in</Link>
          )}
        </div>
      </div>
      <nav className="mx-auto flex h-20 max-w-[1800px] items-center px-6" aria-label="Main">
        <Link href="/" className="leading-none">
          <span className="font-display block text-[1.7rem] tracking-tight">Hyderabad Homes</span>
          <span className="label mt-1 block text-[0.6rem] text-white/70">Plots · Villas · Gated communities</span>
        </Link>
        <div className="ml-auto flex items-center gap-10">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="label hidden hover:underline md:block">
              {l.label}
            </Link>
          ))}
          <Link
            href="/sell"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "border-white bg-transparent text-white hover:bg-white hover:text-navy")}
          >
            Sell with us
          </Link>
        </div>
      </nav>
    </header>
  );
}
