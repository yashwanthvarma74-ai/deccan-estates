"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useCompare } from "@/stores/compare";
import { cn } from "@/lib/utils";

const links = [
  { href: "/listings", label: "Search" },
  { href: "/listings?type=VILLA", label: "Villas" },
  { href: "/listings?type=PLOT", label: "Plots" },
  { href: "/listings?type=GATED_COMMUNITY", label: "Gated communities" },
  { href: "/agents", label: "Agents" },
  { href: "/stories", label: "Stories" },
];

const fmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false, timeZone: "Asia/Kolkata",
});

/** Live date/time in Hyderabad, rendered after mount to avoid a hydration mismatch. */
function Clock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(fmt.format(new Date()).replace(",", ""));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{now ?? " "}</span>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const { data: session } = authClient.useSession();
  const compareCount = useCompare((s) => s.ids.length);

  useEffect(() => setOpen(false), [pathname]);

  // On the home page the header floats over the pinned hero, then turns solid once the hero scrolls away.
  useEffect(() => {
    if (!overlay) { setPastHero(false); return; }
    const onScroll = () => {
      const hero = document.querySelector("[aria-roledescription=carousel]");
      setPastHero(hero ? hero.getBoundingClientRect().bottom < 72 : false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const floating = overlay && !pastHero;
  const light = floating || open;

  return (
    <>
      <header
        className={cn(
          "z-[60] w-full",
          "fixed top-0 transition-colors duration-300",
          !floating && !open && "border-b border-line bg-white/95 backdrop-blur",
          !overlay && "!sticky",
          light ? "text-white" : "text-ink",
        )}
      >
        <div className="mx-auto grid h-[72px] max-w-[1800px] grid-cols-[1fr_auto_1fr] items-start px-6 pt-5">
          <div className="label hidden flex-col gap-1 text-[0.65rem] normal-case tracking-normal md:flex">
            <a href="tel:+919848001000" className="hover:opacity-70">IN +91 98480 01000</a>
            <span className="opacity-60"><Clock /></span>
          </div>
          <span className="md:hidden" />

          <Link href="/" onClick={() => setOpen(false)} className="text-center leading-none">
            <span className="block text-[1.75rem] font-light tracking-tight">Deccan</span>
            <span className="label mt-1 block text-[0.5rem] opacity-70">Estates</span>
          </Link>

          <div className="flex items-start justify-end gap-8">
            <div className="label hidden flex-col items-end gap-1 text-[0.65rem] normal-case tracking-normal lg:flex">
              <span className="tabular-nums">17.3850° N · 78.4867° E</span>
              <span className="opacity-60">Banjara Hills, Hyderabad</span>
            </div>
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="site-menu"
              className="label flex cursor-pointer items-center gap-2 pt-0.5"
            >
              <span aria-hidden className="relative block h-2 w-5">
                <span className={cn("absolute left-0 h-px w-full bg-current transition-all", open ? "top-1 rotate-45" : "top-0")} />
                <span className={cn("absolute left-0 h-px w-full bg-current transition-all", open ? "top-1 -rotate-45" : "top-2")} />
              </span>
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-black px-6 pb-10 pt-28 text-white transition-[clip-path] duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]",
          open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_100%_0)]",
        )}
        aria-hidden={!open}
      >
        <nav className="mx-auto w-full max-w-[1800px]" aria-label="Site">
          <ul className="space-y-1">
            {links.map((l, i) => (
              <li key={l.label} className="overflow-hidden">
                <Link
                  href={l.href}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${150 + i * 60}ms` : "0ms" }}
                  className={cn(
                    "block text-[clamp(2rem,6vw,4.5rem)] font-extralight uppercase leading-[1.1] tracking-[-0.02em] transition-all duration-700 hover:opacity-60",
                    open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="label mx-auto mt-auto flex w-full max-w-[1800px] flex-wrap items-center gap-x-8 gap-y-3 pt-10 text-white/70">
          <Link href="/compare" tabIndex={open ? 0 : -1} className="hover:text-white">Compare ({compareCount})</Link>
          {session ? (
            <>
              <Link href="/saved" tabIndex={open ? 0 : -1} className="hover:text-white">Saved</Link>
              <button tabIndex={open ? 0 : -1} onClick={() => authClient.signOut()} className="cursor-pointer uppercase hover:text-white">Log out</button>
            </>
          ) : (
            <Link href="/login" tabIndex={open ? 0 : -1} className="hover:text-white">Log in / Join</Link>
          )}
          <Link href="/sell" tabIndex={open ? 0 : -1} className="hover:text-white">Sell with us</Link>
        </div>
      </div>
    </>
  );
}
