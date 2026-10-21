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
  const link = "text-[15px] text-ink hover:text-primary";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-white">
      <nav className="mx-auto flex h-16 max-w-[1300px] items-center gap-8 px-6" aria-label="Main">
        <Link href="/" className="shrink-0 whitespace-nowrap text-xl font-bold tracking-tight">
          Deccan Estates
        </Link>
        <div className="ml-4 hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className={link}>{l.label}</Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-5 whitespace-nowrap">
          <Link href="/compare" className={cn(link, "hidden lg:block")}>Compare ({compareCount})</Link>
          {session ? (
            <>
              <Link href="/saved" className={cn(link, "hidden lg:block")}>Saved</Link>
              <button onClick={() => authClient.signOut()} className={cn(link, "hidden cursor-pointer lg:block")}>Log out</button>
            </>
          ) : (
            <Link href="/login" className={link}>Log in</Link>
          )}
          <Link href="/sell" className={cn(buttonVariants({ size: "sm" }), "h-10 px-5")}>Sell with us</Link>
        </div>
      </nav>
    </header>
  );
}
