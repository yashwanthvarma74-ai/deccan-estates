import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { SearchStripLoader } from "@/components/search-strip-loader";
import { SiteFooter } from "@/components/site-footer";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Deccan Estates — plots, villas and gated communities",
  description: "Search RERA-registered plots, villas and gated communities in Hyderabad with an AI assistant.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${interTight.variable} ${geistMono.variable} h-full`}>
      <body id="top" className="flex min-h-full flex-col bg-bg text-ink">
        <Providers>
          {/* usePathname() needs a Suspense boundary under Cache Components. */}
          <Suspense fallback={null}><SiteHeader /></Suspense>
          <SearchStripLoader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
