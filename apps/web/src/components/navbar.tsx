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
      <nav className="mx-auto flex h-20 max-w-[1800px] items-center px-6" aria-label="Main">
        <Link href="/" className="shrink-0 whitespace-nowrap leading-none">
          <span className="font-display block text-[1.7rem] tracking-tight">Deccan Estates</span>
          <span className="label mt-1 hidden text-[0.6rem] text-white/70 xl:block">Plots · Villas · Gated communities</span>
        </Link>
        <div className="ml-auto flex items-center gap-4 whitespace-nowrap lg:gap-8">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="label hidden hover:underline lg:block">
              {l.label}
            </Link>
          ))}
          <Link href="/compare" className="label hidden text-white/80 hover:text-white lg:block">Compare ({compareCount})</Link>
          {session ? (
            <>
              <Link href="/saved" className="label hidden text-white/80 hover:text-white lg:block">Saved</Link>
              <button onClick={() => authClient.signOut()} className="label hidden cursor-pointer text-white/80 hover:text-white lg:block">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="label text-white/80 hover:text-white">Join / Log in</Link>
          )}
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
