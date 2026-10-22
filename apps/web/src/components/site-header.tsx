"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, Star, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useCompare } from "@/stores/compare";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/listings", label: "Homes for sale" },
  { href: "/#localities", label: "Localities" },
  { href: "/agents", label: "Agents" },
  { href: "/stories", label: "Stories" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const compareCount = useCompare((s) => s.ids.length);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !home || open;

  return (
    <>
    {!home && <div aria-hidden className="h-[72px]" />}
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-300", solid ? "bg-bg/90 shadow-[0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl" : "bg-transparent")}>
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-5 px-6 lg:px-[60px]">
        <Link href="/" aria-label="Deccan Estates home" className="shrink-0"><Logo /></Link>

        <Link href="/listings" aria-label="Search homes" className="ml-2 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 transition-colors hover:bg-white/10 md:flex">
          <Search className="h-[18px] w-[18px]" />
        </Link>
        <span aria-hidden className="ml-2 hidden h-10 w-px bg-white/15 lg:block" />
        <nav aria-label="Main" className="hidden items-center gap-6 whitespace-nowrap xl:gap-7 lg:flex">
          {links.map((l) => <Link key={l.label} href={l.href} className="text-[15px] text-white/90 transition-colors hover:text-white">{l.label}</Link>)}
        </nav>

        <div className="ml-auto hidden items-center gap-5 whitespace-nowrap xl:gap-6 lg:flex">
          <Link href="/compare" className="hidden text-[15px] text-white/80 hover:text-white xl:block">Compare ({compareCount})</Link>
          <Link href={session ? "/saved" : "/login"} className="flex items-center gap-2 text-[15px] text-white/90 hover:text-white">
            <Star className="h-[18px] w-[18px]" /> Favorites
          </Link>
          {session ? (
            <button onClick={() => authClient.signOut()} className="hidden cursor-pointer text-[15px] text-white/80 hover:text-white xl:block">Log out</button>
          ) : (
            <Link href="/login" className="hidden text-[15px] text-white/80 hover:text-white xl:block">Log in</Link>
          )}
          <Link href="/listings" className={cn("rounded-lg px-5 py-2.5 text-[15px] font-medium transition-colors", solid ? "bg-white text-bg hover:bg-white/90" : "bg-bg text-white hover:bg-card-hi")}>
            Start searching
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="ml-auto flex h-10 w-10 cursor-pointer items-center justify-center lg:hidden">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-bg px-6 pb-8 pt-4 lg:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {links.map((l) => <Link key={l.label} href={l.href} className="text-lg">{l.label}</Link>)}
            <Link href="/compare" className="text-lg">Compare ({compareCount})</Link>
            <Link href={session ? "/saved" : "/login"} className="text-lg">{session ? "Favorites" : "Log in"}</Link>
            <Link href="/listings" className="mt-2 rounded-lg bg-white px-5 py-3 text-center font-medium text-bg">Start searching</Link>
          </nav>
        </div>
      )}
    </header>
    </>
  );
}
