"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Phone } from "lucide-react";
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
  const item = "flex h-11 items-center gap-2 px-3 text-[17px] text-white/90 transition-colors hover:text-white";

  return (
    <>
      {!home && <div aria-hidden className="h-[72px]" />}
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-300", solid ? "bg-bg/90 shadow-[0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl" : "bg-transparent")}>
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-[60px]">
          <Link href="/" aria-label="Deccan Estates home" className="mr-auto shrink-0"><Logo /></Link>

          <a href={PHONE_HREF} className={item} aria-label={`Call us on ${PHONE_DISPLAY}`}>
            <Phone className="h-5 w-5" />
            <span className="hidden sm:inline">{PHONE_DISPLAY}</span>
            <span className="sm:hidden">Call us</span>
          </a>
          <Link href={session ? "/saved" : "/login"} className={cn(item, "hidden sm:flex")}>
            <Heart className="h-5 w-5" /> Saved homes
          </Link>
          {session ? (
            <button onClick={() => authClient.signOut()} className={cn(item, "hidden cursor-pointer md:flex")}>Log out</button>
          ) : (
            <Link href="/login" className="ml-1 flex h-11 items-center rounded-full border border-white/40 px-5 text-[17px] text-white transition-colors hover:bg-white hover:text-bg">Log in</Link>
          )}
        </div>
      </header>
    </>
  );
}
