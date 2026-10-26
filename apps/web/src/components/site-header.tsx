"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { Dropdown } from "@/components/dropdown";
import { AccountMenu, firstName, useGreeting, useSignOut } from "@/components/account-menu";
import { cn } from "@/lib/utils";

type Item = { label: string; href: string };
const MENUS: { label: string; items?: Item[]; href?: string; wide?: boolean }[] = [
  {
    label: "Buy",
    href: "/listings",
    items: [
      { label: "All homes for sale", href: "/listings" },
      { label: "Plots", href: "/listings?type=PLOT" },
      { label: "Flats", href: "/listings?type=APARTMENT" },
      { label: "Villas", href: "/listings?type=VILLA" },
      { label: "Gated communities", href: "/listings?type=GATED_COMMUNITY" },
      { label: "Commercial spaces for sale", href: "/listings?type=COMMERCIAL" },
    ],
  },
  {
    label: "Rent",
    href: "/listings?deal=RENT",
    items: [
      { label: "All rentals", href: "/listings?deal=RENT" },
      { label: "Flats for rent", href: "/listings?deal=RENT&type=APARTMENT" },
      { label: "Villas for rent", href: "/listings?deal=RENT&type=VILLA" },
      { label: "Gated community rentals", href: "/listings?deal=RENT&type=GATED_COMMUNITY" },
    ],
  },
  {
    label: "Commercial",
    href: "/listings?deal=LEASE",
    items: [
      { label: "All commercial for lease", href: "/listings?deal=LEASE" },
      { label: "Offices and shops for lease", href: "/listings?deal=LEASE&type=COMMERCIAL" },
      { label: "Commercial plots for lease", href: "/listings?deal=LEASE&type=PLOT" },
      { label: "Commercial spaces for sale", href: "/listings?type=COMMERCIAL" },
    ],
  },
  {
    label: "Areas",
    items: ["Gachibowli", "Kondapur", "Kokapet", "Narsingi", "Miyapur", "Kompally"].map((n) => ({ label: n, href: `/listings?locality=${n.toLowerCase()}` })),
  },
  { label: "Verified", href: "/listings?verified=1" },
  { label: "Resources", items: [] },
  // Guides sit in the Resources menu too; the top-level link only shows when the bar has room.
  { label: "Guides", href: "/stories", wide: true },
];

/** Terminal-style navigation: one floating dark bar, dropdown groups, and three mono-caps actions (lime, white, grey). */
export function SiteHeader() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const greeting = useGreeting();
  const signOut = useSignOut();

  const resources: Item[] = [
    ...(session ? [{ label: "My profile", href: "/account/profile" }, { label: "Account settings", href: "/account/settings" }, { label: "My listings", href: "/account" }] : []),
    { label: "Saved homes", href: session ? "/saved" : "/login" },
    { label: "Sell with agent help", href: "/sell" },
    { label: "Compare homes", href: "/compare" },
    { label: "Buying guides", href: "/stories" },
    session ? { label: "Log out", href: "#logout" } : { label: "Log in", href: "/login" },
  ];
  const btn = "mono-label flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-5 transition-transform hover:scale-[1.03] active:scale-95";

  return (
    <>
      {!home && <div aria-hidden className="h-[104px]" />}
      {!home && <div aria-hidden className="fixed inset-x-0 top-0 z-40 h-[98px] bg-black" />}
      <header className="fixed inset-x-0 top-4 z-50 px-3">
        <div className="relative mx-auto flex h-[78px] w-full max-w-[1360px] items-center gap-3 rounded-xl bg-black/80 pl-5 pr-3 backdrop-blur-xl sm:gap-4 sm:pl-6 sm:pr-4">
          <Link href="/" aria-label="Deccan Estates home" className="shrink-0"><Logo /></Link>

          <nav aria-label="Main" className="ml-2 hidden items-center gap-1 min-[1180px]:flex">
            {MENUS.map((m) => {
              const items = m.label === "Resources" ? resources : m.items;
              if (!items) return <Link key={m.label} href={m.href!} className={cn("h-11 items-center px-3 text-[15px] font-medium text-white/95 hover:text-white", m.wide ? "hidden min-[1280px]:flex" : "flex")}>{m.label}</Link>;
              return (
                <Dropdown key={m.label} href={m.href} trigger={m.label} buttonClassName="flex h-11 cursor-pointer items-center gap-1.5 px-3 text-[15px] font-medium text-white/95 hover:text-white">
                  <ul role="menu" className="min-w-52 rounded-xl border border-white/10 bg-black/90 p-2 backdrop-blur-xl">
                    {items.map((it) => (
                      <li key={it.label} role="none">
                        {it.href === "#logout"
                          ? <button role="menuitem" onClick={() => authClient.signOut()} className="block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-[15px] text-white/85 hover:bg-white/10 hover:text-white">{it.label}</button>
                          : <Link role="menuitem" href={it.href} className="block rounded-lg px-3 py-2.5 text-[15px] text-white/85 hover:bg-white/10 hover:text-white">{it.label}</Link>}
                      </li>
                    ))}
                  </ul>
                </Dropdown>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/post" className={cn(btn, "bg-[#b6f400] text-black")}><span className="sm:hidden">Post</span><span className="hidden sm:inline">Post property</span></Link>
            {session
              ? <AccountMenu />
              : <Link href="/login" className={cn(btn, "hidden bg-white text-black sm:flex")}>Log in</Link>}
            <a href="tel:+919985079998" className={cn(btn, "hidden bg-[#d9dada] text-[#2b3030] min-[1440px]:flex")}>Contact us</a>
            <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="ml-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-white min-[1180px]:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Mobile" className="mx-auto mt-2 max-w-[1360px] rounded-xl bg-black/90 p-4 backdrop-blur-xl min-[1180px]:hidden">
            {session && <p className="px-3 pb-2 pt-1 text-[15px] text-white/80">{greeting || "Hello"}, <span className="font-medium text-white">{firstName(session.user.name, session.user.email)}</span></p>}
            <ul className="grid gap-1 text-[16px]">
              {[{ label: "Buy", href: "/listings" }, { label: "Rent", href: "/listings?deal=RENT" }, { label: "Commercial", href: "/listings?deal=LEASE" }, { label: "Post your property", href: "/post" }, ...MENUS[0].items!.slice(1), { label: "Verified listings", href: "/listings?verified=1" }, ...resources.filter((r) => r.href !== "#logout"), { label: "Guides", href: "/stories" }, ...(session ? [] : [{ label: "Log in or sign up", href: "/login" }])].map((it) => (
                <li key={it.label}><Link href={it.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-white/90 hover:bg-white/10">{it.label}</Link></li>
              ))}
            </ul>
            {session && <button onClick={() => { setOpen(false); signOut(); }} className="mt-1 block w-full cursor-pointer rounded-lg px-3 py-3 text-left text-[16px] text-white/90 hover:bg-white/10">Log out</button>}
          </nav>
        )}
      </header>
    </>
  );
}
