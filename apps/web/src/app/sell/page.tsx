import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SellForm } from "@/components/sell-form";

export const metadata: Metadata = { title: "Sell with us", description: "Tell us about your plot, flat, villa or office and a RERA-registered agent will call you." };

export default function SellPage() {
  return (
    <>
      <PageHeader eyebrow="Sell with us" title="Tell us about your property.">An agent will call you, check your papers with you and list it with a verification score so serious buyers find it first.</PageHeader>
      <section className="mx-auto max-w-[1320px] px-5 pb-24 sm:px-8">
        <div className="max-w-[820px]"><SellForm /></div>
      </section>
    </>
  );
}
