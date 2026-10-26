import type { Metadata } from "next";
import credits from "../../../public/places/credits.json";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Photo credits", description: "Who took the photos of Hyderabad areas used on Deccan Estates, and under which licence." };

export default function CreditsPage() {
  return (
    <>
      <PageHeader eyebrow="Credits" title="Photo credits.">
        Area photos on this site come from Wikimedia Commons and are used under the licences below. Photos on listings posted by owners belong to the people who uploaded them.
      </PageHeader>
      <section className="mx-auto max-w-[1000px] px-5 pb-24 sm:px-8">
        <ul>
          {credits.map((c) => (
            <li key={c.file} className="grid gap-1 border-t border-white/12 py-5 sm:grid-cols-[1fr_auto] sm:gap-8">
              <p className="text-[1.05rem]">
                <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-[#b6f400]">{c.title.replace(/\.(jpe?g)$/i, "")}</a>
                <span className="text-white/70"> by {c.author}</span>
              </p>
              <p className="mono-label text-white/70">
                {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">{c.license}</a> : c.license}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
