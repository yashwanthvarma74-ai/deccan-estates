import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PostForm } from "@/components/post-form";

export const metadata: Metadata = {
  title: "Post your property",
  robots: { index: false },
  description: "List a plot, flat, villa, gated community home or commercial space to sell, rent or lease in Hyderabad. Free for owners.",
};

export default function PostPage() {
  return (
    <>
      <PageHeader eyebrow="Post a property" title="Put your place in front of Hyderabad.">
        Sell, rent or lease a plot, flat, villa, gated community home or office. It is free, and live as soon as you post.
      </PageHeader>
      <PostForm />
    </>
  );
}
