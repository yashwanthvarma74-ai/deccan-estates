import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-[1320px] flex-col justify-center px-5 py-24 sm:px-8">
      <p className="mono-label text-white/60">Error 404</p>
      <h1 className="mt-5 max-w-[14ch] text-[clamp(2.8rem,7vw,6rem)] font-normal leading-[0.95] tracking-[-0.055em]">This plot is not on the map.</h1>
      <p className="mt-6 max-w-[44ch] text-[1.1rem] text-white/65">The page you wanted does not exist or has moved. Search every home instead, or go back to the start.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/listings" className="mono-label flex h-14 items-center rounded-lg bg-[#b6f400] px-8 text-black transition-transform hover:scale-[1.03]">Search homes</Link>
        <Link href="/" className="mono-label flex h-14 items-center rounded-lg bg-white/10 px-8 text-white/85 transition-colors hover:bg-white/20">Home</Link>
      </div>
    </section>
  );
}
