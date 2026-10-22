import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Preloader } from "@/components/preloader";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["200", "300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "Deccan Estates — plots, villas and gated communities",
  description: "Search RERA-registered plots, villas and gated communities in Hyderabad with an AI assistant.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full`}>
      <body id="top" className="flex min-h-full flex-col">
        <Providers>
          <Preloader />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
