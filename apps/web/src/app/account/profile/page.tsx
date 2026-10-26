import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProfileView } from "@/components/profile-view";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

export default function ProfilePage() {
  return (
    <>
      <PageHeader eyebrow="Your account" title="My profile.">Your details and what you have posted and saved.</PageHeader>
      <ProfileView />
    </>
  );
}
