import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Deccan Estates — plots, villas and gated communities",
  description: "Search RERA-registered plots, villas and gated communities in Hyderabad with an AI assistant.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrument.variable} h-full`}>
      <body id="top" className="flex min-h-full flex-col bg-bg text-ink">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
