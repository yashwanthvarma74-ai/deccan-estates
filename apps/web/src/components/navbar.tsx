"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const account = session ? (
    <>
      <Link href="/saved" className="label text-white/80 hover:text-white" onClick={() => setOpen(false)}>Saved</Link>
      <button onClick={() => authClient.signOut()} className="label cursor-pointer text-white/80 hover:text-white">Log out</button>
    </>
  ) : (
    <Link href="/login" className="label text-white/80 hover:text-white" onClick={() => setOpen(false)}>Join / Log in</Link>
  );

  return (
    <header className={cn("sticky top-0 z-50 bg-navy text-white transition-shadow", scrolled ? "shadow-[0_4px_20px_rgb(0_0_0/0.25)]" : "border-b border-white/10")}>
      <nav className="mx-auto flex h-20 max-w-[1800px] items-center px-6" aria-label="Main">
        <Link href="/" className="mr-6 shrink-0 whitespace-nowrap leading-none">
          <span className="font-display block text-2xl tracking-tight xl:text-[1.75rem]">Deccan Estates</span>
          <span className="label mt-1.5 hidden text-[0.6rem] text-white/60 xl:block">Plots · Villas · Gated communities</span>
        </Link>

        <div className="ml-auto hidden items-center gap-5 whitespace-nowrap lg:flex xl:gap-9">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="label underline-offset-8 hover:underline">{l.label}</Link>
          ))}
          <Link href="/compare" className="label text-white/80 hover:text-white">Compare ({compareCount})</Link>
          {account}
          <Link
            href="/sell"
            className={cn(buttonVariants({ variant: "outline" }), "border-white bg-transparent text-white hover:bg-white hover:text-navy")}
          >
            Sell with us
          </Link>
        </div>

        <button
          className="ml-auto flex h-11 w-11 cursor-pointer items-center justify-center lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-navy px-6 pb-6 lg:hidden">
          <div className="flex flex-col gap-5 pt-5">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="label" onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
            <Link href="/compare" className="label" onClick={() => setOpen(false)}>Compare ({compareCount})</Link>
            <div className="flex gap-6">{account}</div>
            <Link href="/sell" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "border-white bg-transparent text-white")}>
              Sell with us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
