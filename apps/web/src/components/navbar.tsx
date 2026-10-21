"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useCompare } from "@/stores/compare";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const compareCount = useCompare((s) => s.ids.length);

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold text-emerald-800 dark:text-emerald-400">
          Hyderabad Homes
        </Link>
        <Link href="/listings" className="text-sm hover:underline">Browse</Link>
        <Link href="/compare" className="text-sm hover:underline">Compare ({compareCount})</Link>
        <div className="ml-auto flex items-center gap-3">
          {session ? (
            <>
              <Link href="/saved" className="text-sm hover:underline">Saved</Link>
              <Button variant="outline" size="sm" onClick={() => authClient.signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:underline">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
