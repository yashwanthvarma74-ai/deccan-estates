import type { Metadata } from "next";
import { MyListings } from "@/components/my-listings";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "My listings", robots: { index: false } };

export default function AccountPage() {
  return (
    <>
      <PageHeader eyebrow="Your account" title="My listings.">Pause a listing, mark it as closed, or remove it at any time.</PageHeader>
      <MyListings />
    </>
  );
}
