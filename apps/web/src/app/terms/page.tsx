import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Terms of service", description: "The rules for using Deccan Estates." };

const sections = [
  ["Using the site", "Deccan Estates helps you search, compare and enquire about homes in Hyderabad. You agree to give accurate details when you contact us or list a property."],
  ["Listings and prices", "Listings are supplied by agents and owners. Prices, sizes and availability can change without notice, and a listing is not an offer. Always visit the property and see the papers before paying any amount."],
  ["Verification reports", "A verification score summarises the checks we ran on the documents available to us. It is a guide, not legal advice or a guarantee of title. Take independent legal advice before you buy."],
  ["No brokerage until you agree", "Searching and enquiring on the site is free. Any fee is agreed with you in writing before it applies."],
  ["Your content", "If you submit photos or descriptions, you confirm you have the right to share them and allow us to display them on the site."],
  ["Liability", "To the extent the law allows, we are not liable for losses arising from decisions made using the site. Nothing here limits rights you have under Indian consumer law."],
  ["Governing law", "These terms are governed by the laws of India and the courts at Hyderabad, Telangana."],
];

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of service.">Last updated 26 October 2026.</PageHeader>
      <section className="mx-auto max-w-[760px] px-5 pb-24 sm:px-8">
        {sections.map(([h, p]) => (
          <div key={h} className="border-t border-white/12 py-8">
            <h2 className="text-[1.5rem] tracking-[-0.03em]">{h}</h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-white/75">{p}</p>
          </div>
        ))}
      </section>
    </>
  );
}
