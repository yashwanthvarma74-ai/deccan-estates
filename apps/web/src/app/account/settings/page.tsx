import type { Metadata } from "next";
import { AccountSettings } from "@/components/account-settings";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Account settings", robots: { index: false } };

export default function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Your account" title="Account settings.">Change your name, password and how you sign in.</PageHeader>
      <AccountSettings />
    </>
  );
}
