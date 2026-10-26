"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { AccountMenu, firstName, useGreeting } from "@/components/account-menu";
import { cn } from "@/lib/utils";

type Item = { label: string; href: string };
const MENUS: { label: string; items?: Item[]; href?: string }[] = [
  {
    label: "Homes",
    items: [
      { label: "All homes for sale", href: "/listings" },
      { label: "Homes for rent", href: "/listings?deal=RENT" },
      { label: "Commercial spaces", href: "/listings?deal=LEASE" },
      { label: "Plots", href: "/listings?type=PLOT" },
      { label: "Flats", href: "/listings?type=APARTMENT" },
      { label: "Villas", href: "/listings?type=VILLA" },
      { label: "Gated communities", href: "/listings?type=GATED_COMMUNITY" },
      { label: "Commercial", href: "/listings?type=COMMERCIAL" },
    ],
  },
  {
    label: "Areas",
    items: ["Gachibowli", "Kondapur", "Kokapet", "Narsingi", "Miyapur", "Kompally"].map((n) => ({ label: n, href: `/listings?locality=${n.toLowerCase()}` })),
  },
  { label: "Verified", href: "/listings?verified=1" },
  { label: "Resources", items: [] },
  { label: "Guides", href: "/stories" },
];

/** Terminal-style navigation: one floating dark bar, dropdown groups, and three mono-caps actions (lime, white, grey). */
export function SiteHeader() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const greeting = useGreeting();

  const resources: Item[] = [
    ...(session ? [{ label: "My listings", href: "/account" }] : []),
    { label: "Saved homes", href: session ? "/saved" : "/login" },
    { label: "Sell with agent help", href: "/sell" },
    { label: "Compare homes", href: "/compare" },
    session ? { label: "Log out", href: "#logout" } : { label: "Log in", href: "/login" },
  ];
  const btn = "flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-5 text-[13px] font-medium uppercase tracking-[0.12em] transition-transform hover:scale-[1.03] active:scale-95";

  return (
    <>
      {!home && <div aria-hidden className="h-[104px]" />}
      {!home && <div aria-hidden className="fixed inset-x-0 top-0 z-40 h-[98px] bg-black" />}
      <header className="fixed inset-x-0 top-4 z-50 px-3">
        <div className="relative mx-auto flex h-[78px] w-full max-w-[1036px] items-center gap-4 rounded-xl bg-black/80 pl-5 pr-3 backdrop-blur-xl sm:gap-6 sm:pl-6 sm:pr-4">
          <Link href="/" aria-label="Deccan Estates home" className="shrink-0"><Logo /></Link>

          <nav aria-label="Main" className="ml-2 hidden items-center gap-1 min-[1180px]:flex">
            {MENUS.map((m) => {
              const items = m.label === "Resources" ? resources : m.items;
              if (!items) return <Link key={m.label} href={m.href!} className="flex h-11 items-center px-3 text-[15px] font-medium text-white/95 hover:text-white">{m.label}</Link>;
              return (
                <div key={m.label} className="group relative">
                  <button className="flex h-11 cursor-pointer items-center gap-1.5 px-3 text-[15px] font-medium text-white/95 hover:text-white" aria-haspopup="menu">
                    {m.label}<ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                  </button>
                  <div className="invisible absolute left-0 top-full z-10 pt-3 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul role="menu" className="min-w-52 rounded-xl border border-white/10 bg-black/90 p-2 backdrop-blur-xl">
                      {items.map((it) => (
                        <li key={it.label} role="none">
                          {it.href === "#logout"
                            ? <button role="menuitem" onClick={() => authClient.signOut()} className="block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-[15px] text-white/85 hover:bg-white/10 hover:text-white">{it.label}</button>
                            : <Link role="menuitem" href={it.href} className="block rounded-lg px-3 py-2.5 text-[15px] text-white/85 hover:bg-white/10 hover:text-white">{it.label}</Link>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/post" className={cn(btn, "bg-[#b6f400] text-black")}>Post property</Link>
            {session
              ? <AccountMenu />
              : <Link href="/login" className={cn(btn, "hidden bg-white text-black sm:flex")}>Log in</Link>}
            <a href="tel:+919985079998" className={cn(btn, "hidden bg-[#d9dada] text-[#2b3030] min-[1180px]:flex")}>Contact us</a>
            <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="ml-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-white min-[1180px]:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Mobile" className="mx-auto mt-2 max-w-[1036px] rounded-xl bg-black/90 p-4 backdrop-blur-xl min-[1180px]:hidden">
            {session && <p className="px-3 pb-2 pt-1 text-[15px] text-white/80">{greeting || "Hello"}, <span className="font-medium text-white">{firstName(session.user.name, session.user.email)}</span></p>}
            <ul className="grid gap-1 text-[16px]">
              {[{ label: "Post your property", href: "/post" }, ...MENUS[0].items!, { label: "Verified listings", href: "/listings?verified=1" }, ...resources.filter((r) => r.href !== "#logout"), { label: "Guides", href: "/stories" }, ...(session ? [] : [{ label: "Log in or sign up", href: "/login" }])].map((it) => (
                <li key={it.label}><Link href={it.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-white/90 hover:bg-white/10">{it.label}</Link></li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
