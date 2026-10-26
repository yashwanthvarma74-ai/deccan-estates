import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { SearchStripLoader } from "@/components/search-strip-loader";
import { SiteFooter } from "@/components/site-footer";
import { AskAI } from "@/components/ask-ai";
import { siteUrl } from "@/lib/site-url";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Deccan Estates: plots, flats, villas and offices in Hyderabad", template: "%s · Deccan Estates" },
  description: "Search plots, flats, villas, gated communities and offices in Hyderabad. Every listing shows a verification score for its papers, approvals and title.",
  openGraph: { type: "website", siteName: "Deccan Estates", title: "Deccan Estates: papers checked before you pay", description: "Plots, flats, villas and offices in Hyderabad with a verification score on every listing.", images: ["/stills/s1.jpg"] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

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
          <Suspense fallback={null}>
            <AskAI />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
