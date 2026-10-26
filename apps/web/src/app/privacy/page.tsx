import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Privacy policy", description: "What Deccan Estates collects, why, and how to ask us to delete it." };

const sections = [
  ["What we collect", "When you send an enquiry or a sell request we keep the name, phone number, email and property details you type in. If you create an account we also keep your email and the homes you save or compare. We do not collect payment details."],
  ["How we use it", "We use your details to reply to your enquiry, connect you with the agent for a listing and keep your saved homes. We do not sell your information."],
  ["Who sees it", "Your enquiry is shared only with the agent or team handling it. Our hosting and database providers process data on our behalf under their own security terms."],
  ["Cookies", "We use a session cookie to keep you signed in and remember your last search. We do not run advertising trackers."],
  ["Your choices", "You can ask us to see, correct or delete what we hold about you by calling or messaging us on +91 99850 79998. We will act on it within 30 days."],
  ["Changes", "If this policy changes, the new version will appear on this page with its date."],
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy.">Last updated 26 October 2026.</PageHeader>
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
