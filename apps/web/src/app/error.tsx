"use client";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-[1320px] flex-col justify-center px-5 py-24 sm:px-8" role="alert">
      <p className="mono-label text-white/60">Something went wrong</p>
      <h1 className="mt-5 max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)] font-normal leading-[0.97] tracking-[-0.055em]">We could not load this page.</h1>
      <p className="mt-6 max-w-[44ch] text-[1.1rem] text-white/65">It is on our side. Try again, and if it keeps happening, call us on +91 99850 79998.</p>
      <div className="mt-10"><button onClick={reset} className="mono-label h-14 cursor-pointer rounded-lg bg-[#b6f400] px-8 text-black transition-transform hover:scale-[1.03]">Try again</button></div>
    </section>
  );
}
