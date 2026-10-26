"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    const res =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name: String(f.get("name") || email) })
        : await authClient.signIn.email({ email, password });
    if (res.error) return setError(res.error.message ?? "Something went wrong");
    router.push("/");
    router.refresh();
  }

  async function passkeySignIn() {
    const res = await authClient.signIn.passkey();
    if (res?.error) return setError(res.error.message ?? "Passkey sign-in failed");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto my-16 max-w-md space-y-5 rounded-3xl border border-white/12 bg-white/[0.03] p-8 sm:p-10">
      <p className="mono-label flex items-center gap-3 text-white/60"><span className="h-px w-8 bg-[#b6f400]" />{mode === "signin" ? "Welcome back" : "Join Deccan Estates"}</p>
      <h1 className="text-[2.6rem] tracking-[-0.05em]">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" && <Input name="name" placeholder="Full name" required aria-label="Full name" />}
        <Input name="email" type="email" placeholder="Email" required aria-label="Email" />
        <Input name="password" type="password" placeholder="Password (8+ chars)" minLength={8} required aria-label="Password" />
        {error && <p role="alert" className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <Button type="submit" className="w-full">{mode === "signin" ? "Sign in" : "Sign up"}</Button>
      </form>
      <Button variant="outline" className="w-full" onClick={passkeySignIn}>Sign in with a passkey</Button>
      <button className="text-sm underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
