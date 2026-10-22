"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Reads the current search filters from the URL and updates them, resetting to page 1. */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const set = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) (v ? next.set(k, v) : next.delete(k));
    next.delete("page");
    router.push(`${pathname === "/" ? "/listings" : pathname}?${next}`, { scroll: false });
  };
  return { sp, set };
}
