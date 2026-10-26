"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const field = "mt-1.5 h-12 w-full rounded-lg border border-white/20 bg-white/[0.04] px-3 text-[15px] text-white outline-none placeholder:text-white/40 focus-visible:border-[#b6f400]";
type Note = { ok: boolean; text: string } | null;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 sm:p-8">
      <h2 className="text-[1.5rem] tracking-[-0.03em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Message({ note }: { note: Note }) {
  if (!note) return null;
  return <p role={note.ok ? "status" : "alert"} className={note.ok ? "text-sm text-[#b6f400]" : "text-sm text-red-300"}>{note.text}</p>;
}

export function AccountSettings() {
  const { data: session, isPending } = authClient.useSession();
  const [nameNote, setNameNote] = useState<Note>(null);
  const [passNote, setPassNote] = useState<Note>(null);
  const [keyNote, setKeyNote] = useState<Note>(null);
  const [busy, setBusy] = useState("");

  if (isPending) return <p className="px-8 pb-24 text-white/70">Loading…</p>;
  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 text-center">
        <p className="text-white/75">Sign in to change your account settings.</p>
        <Link href="/login?next=/account/settings" className="mono-label mt-6 inline-flex h-12 items-center rounded-lg bg-[#b6f400] px-7 text-black">Log in or sign up</Link>
      </div>
    );
  }

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    if (name.length < 2) return setNameNote({ ok: false, text: "Enter your name." });
    setBusy("name");
    const r = await authClient.updateUser({ name });
    setBusy("");
    setNameNote(r.error ? { ok: false, text: r.error.message ?? "Could not save." } : { ok: true, text: "Saved." });
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const next = String(f.get("next"));
    if (next !== String(f.get("again"))) return setPassNote({ ok: false, text: "The new passwords do not match." });
    setBusy("password");
    const r = await authClient.changePassword({ currentPassword: String(f.get("current")), newPassword: next, revokeOtherSessions: true });
    setBusy("");
    if (r.error) return setPassNote({ ok: false, text: r.error.message ?? "Could not change the password." });
    form.reset();
    setPassNote({ ok: true, text: "Password changed. You have been signed out on your other devices." });
  }

  async function addPasskey() {
    setBusy("passkey");
    const r = await authClient.passkey.addPasskey({ name: "This device" });
    setBusy("");
    setKeyNote(r?.error ? { ok: false, text: r.error.message ?? "Could not add a passkey." } : { ok: true, text: "Passkey added. You can use it to sign in next time." });
  }

  return (
    <div className="mx-auto grid max-w-[760px] gap-5 px-5 pb-24 sm:px-8">
      <Card title="Your name">
        <form onSubmit={saveName} className="grid gap-4">
          <label className="text-sm text-white/80">Name<input name="name" defaultValue={session.user.name} required minLength={2} maxLength={80} className={field} /></label>
          <p className="text-sm text-white/60">Email: {session.user.email} (cannot be changed here)</p>
          <div className="flex items-center gap-4"><button disabled={busy === "name"} className="mono-label h-11 cursor-pointer rounded-lg bg-white px-6 text-black disabled:opacity-60">Save</button><Message note={nameNote} /></div>
        </form>
      </Card>
      <Card title="Change password">
        <form onSubmit={savePassword} className="grid gap-4">
          <label className="text-sm text-white/80">Current password<input name="current" type="password" required autoComplete="current-password" className={field} /></label>
          <label className="text-sm text-white/80">New password<input name="next" type="password" required minLength={8} autoComplete="new-password" className={field} /></label>
          <label className="text-sm text-white/80">New password again<input name="again" type="password" required minLength={8} autoComplete="new-password" className={field} /></label>
          <div className="flex items-center gap-4"><button disabled={busy === "password"} className="mono-label h-11 cursor-pointer rounded-lg bg-white px-6 text-black disabled:opacity-60">Change password</button><Message note={passNote} /></div>
        </form>
      </Card>
      <Card title="Passkey">
        <p className="text-white/75">Sign in with your fingerprint, face or device PIN instead of a password.</p>
        <div className="mt-4 flex items-center gap-4"><button onClick={addPasskey} disabled={busy === "passkey"} className="mono-label h-11 cursor-pointer rounded-lg border border-white/25 px-6 text-white/90 hover:text-white disabled:opacity-60">Add a passkey</button><Message note={keyNote} /></div>
      </Card>
    </div>
  );
}
