"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone, Search, Star } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const PHONE_DISPLAY = "+91 98480 01000";
const PHONE_HREF = "tel:+919848001000";

/**
 * Deliberately short: logo, a phone number anyone can tap, saved homes and login.
 * Finding a property happens from the big choices on the home page, not from a menu.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !home;
  const item = "flex h-11 items-center gap-2 px-2 text-[15px] text-white/90 transition-colors hover:text-white";

  return (
    <>
      {!home && <div aria-hidden className="h-[72px]" />}
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", solid ? "px-3 pt-3" : "px-0 pt-0")}>
        <div className={cn("mx-auto flex max-w-[1320px] items-center gap-2 px-4 transition-all duration-300 sm:px-6", solid ? "h-[60px] rounded-2xl border border-white/10 bg-neutral-800/55 backdrop-blur-2xl" : "h-[88px]")}>
          <Link href="/" aria-label="Deccan Estates home" className="shrink-0"><Logo /></Link>
          <Link href="/listings" aria-label="Search all homes" className="ml-3 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 transition-colors hover:bg-white/10 md:flex">
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <span aria-hidden className="ml-3 hidden h-10 w-px bg-white/15 md:block" />

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <a href={PHONE_HREF} className={item} aria-label={`Call us on ${PHONE_DISPLAY}`}>
              <Phone className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">{PHONE_DISPLAY}</span>
              <span className="sm:hidden">Call</span>
            </a>
            <Link href={session ? "/saved" : "/login"} className={cn(item, "hidden sm:flex")}>
              <Star className="h-[18px] w-[18px]" /> Favorites
            </Link>
            {session ? (
              <button onClick={() => authClient.signOut()} className={cn(item, "hidden cursor-pointer md:flex")}>Log out</button>
            ) : (
              <Link href="/login" className={cn(item, "hidden md:flex")}>Log in</Link>
            )}
            <Link href="/listings" className={cn("flex h-11 items-center rounded-lg px-5 text-[15px] font-medium transition-colors", solid ? "bg-white text-bg hover:bg-white/90" : "bg-bg text-white hover:bg-card-hi")}>
              Start searching
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
