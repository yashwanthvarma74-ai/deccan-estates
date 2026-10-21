"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { PUBLIC_API_URL, listingSchema } from "@/lib/api";
import { z } from "zod";

async function authedFetch(path: string, init?: RequestInit) {
  const { data } = await authClient.token();
  if (!data) throw new Error("unauthenticated");
  const res = await fetch(`${PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${data.token}` },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export function useSaved() {
  const { data: session } = authClient.useSession();
  return useQuery({
    queryKey: ["saved"],
    enabled: !!session,
    queryFn: async () => z.array(listingSchema).parse(await authedFetch("/me/saved")),
  });
}

export function SaveButton({ listingId }: { listingId: string }) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const saved = useSaved();
  const isSaved = saved.data?.some((l) => l.id === listingId) ?? false;

  const toggle = useMutation({
    mutationFn: () => authedFetch(`/me/saved/${listingId}`, { method: isSaved ? "DELETE" : "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      disabled={toggle.isPending}
      onClick={() => (session ? toggle.mutate() : router.push("/login"))}
    >
      {isSaved ? "Saved ✓" : "Save listing"}
    </Button>
  );
}
