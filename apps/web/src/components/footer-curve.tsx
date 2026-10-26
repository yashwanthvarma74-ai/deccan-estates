"use client";
import { usePathname } from "next/navigation";

/** The dipped top edge of the footer, painted in the colour of the section above it (white on the home page, black elsewhere). */
export function FooterCurve() {
  const home = usePathname() === "/";
  return (
    <svg aria-hidden className={`absolute inset-x-0 top-0 h-9 w-full ${home ? "text-paper" : "text-bg"}`} viewBox="0 0 1920 40" preserveAspectRatio="none">
      <path fill="currentColor" d="M0 0H1920V14H1620C1570 14 1568 38 1516 38H404C352 38 350 14 300 14H0Z" />
    </svg>
  );
}
