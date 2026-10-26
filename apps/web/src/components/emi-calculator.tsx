"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CompoundFrame } from "@/components/compound-frame";
import { formatInr } from "@/lib/utils";

const Field = ({ label, value, onChange, prefix, suffix, step = 1 }: { label: string; value: number; onChange: (n: number) => void; prefix?: string; suffix?: string; step?: number }) => (
  <label className="block border-b border-paper-ink/25 pb-3">
    <span className="text-[15px] text-paper-ink/80">{label}</span>
    <span className="mt-3 flex items-baseline gap-2 text-[1.35rem] text-paper-ink">
      {prefix && <span className="text-paper-ink/45">{prefix}</span>}
      <input type="number" inputMode="decimal" min={0} step={step} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-transparent outline-none" />
      {suffix && <span className="text-paper-ink/45">{suffix}</span>}
    </span>
  </label>
);

/** Affordability calculator: price, down payment, tenure and rate give the EMI and the true all-in cost, with a link to homes in that budget. */
export function EmiCalculator() {
  const [priceL, setPriceL] = useState(85);   // lakhs
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.6);
  const [urgency, setUrgency] = useState(5);

  // taller price, taller compound wall: 20 lakh to 10 crore maps onto 0..1
  const level = Math.pow(Math.min(1, Math.max(0, (priceL - 20) / 980)), 0.75);
  const crore = priceL / 100;
  const priceLabel = priceL >= 100 ? `₹${Number.isInteger(crore) ? crore : crore.toFixed(2).replace(/0+$/, "")} Cr` : `₹${priceL} L`;
  const r = useMemo(() => {
    const price = priceL * 100000;
    const loan = price * (1 - downPct / 100);
    const m = rate / 1200, n = years * 12;
    const emi = m === 0 ? loan / Math.max(1, n) : (loan * m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1);
    const total = emi * n;
    const duty = price * 0.06; // Telangana: 4% stamp duty + 1.5% transfer duty + 0.5% registration (approx.)
    return { price, loan, emi: Math.round(emi || 0), interest: Math.round(Math.max(0, total - loan)), duty: Math.round(duty), down: Math.round(price * downPct / 100) };
  }, [priceL, downPct, years, rate]);

  return (
    <section id="calculator" className="bg-paper pb-24 pt-6 text-paper-ink" aria-labelledby="calc-h">
     <CompoundFrame level={level}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.02fr] lg:gap-14">
        <div>
          <p className="text-[1.15rem] text-paper-ink/45">Calculator</p>
          <h2 id="calc-h" className="mt-1 text-[clamp(1.9rem,2.6vw,2.6rem)] font-normal tracking-[-0.04em] text-paper-ink">Tell us about your budget:</h2>
          <div className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-2">
            <Field label="Home price" prefix="₹" suffix="lakh" value={priceL} onChange={setPriceL} />
            <Field label="Down payment" suffix="%" value={downPct} onChange={(n) => setDownPct(Math.min(90, n))} />
            <Field label="Loan tenure" suffix="years" value={years} onChange={(n) => setYears(Math.min(30, n))} />
            <Field label="Interest rate, a year" suffix="%" value={rate} onChange={setRate} step={0.1} />
          </div>
          <div className="mt-10">
            <div className="flex items-baseline justify-between">
              <label htmlFor="price-range" className="text-[15px] text-paper-ink/80">Drag to set the price <span className="text-paper-ink/55">(raise the price and watch your place grow bigger)</span></label>
              <span className="text-[1.6rem] tracking-[-0.03em] tabular-nums text-paper-ink">{priceLabel}</span>
            </div>
            <input id="price-range" type="range" min={20} max={1000} step={5} value={Math.min(1000, Math.max(20, priceL || 20))} onChange={(ev) => setPriceL(Number(ev.target.value))} className="mt-5 h-1.5 w-full cursor-pointer appearance-none rounded bg-paper-ink/20 accent-[#0d2a22]" />
            <div className="mono-label mt-3 flex justify-between text-paper-ink/45"><span>₹20 L</span><span>₹5 Cr</span><span>₹10 Cr</span></div>
          </div>
          <div className="mt-10">
            <label htmlFor="urg" className="text-[15px] text-paper-ink/80">How soon do you plan to buy?</label>
            <input id="urg" type="range" min={1} max={10} value={urgency} onChange={(e) => setUrgency(Number(e.target.value))} className="mt-5 h-1 w-full cursor-pointer appearance-none rounded bg-paper-ink/25 accent-paper-ink" />
            <div className="mono-label mt-3 flex justify-between text-paper-ink/45"><span>1 · Exploring</span><span>{urgency === 5 ? "5 · Medium" : urgency}</span><span>10 · This month</span></div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[640px] drop-shadow-[0_30px_50px_rgb(8_31_25/0.3)]">
          {/* The plate is cut into a villa: eaves, a hip roof, a chimney and a body with the numbers inside. */}
          <div role="group" aria-label="Monthly EMI estimate" className="text-white">
            {/* roof: a fixed shape that scales with the width, so it never clips the content below it */}
            <div className="relative aspect-[3/1] w-full [clip-path:polygon(0_100%,50%_7%,68%_41%,68%_11%,76%_11%,76%_56%,100%_100%)]" style={{ backgroundImage: "radial-gradient(120% 140% at 10% 0%, rgb(70 120 40 / 0.5) 0%, transparent 60%), linear-gradient(170deg, #0d2a22 0%, #0b2219 100%)" }}>
              <div aria-hidden className="absolute inset-0 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_17px,rgb(255_255_255/0.07)_17px,rgb(255_255_255/0.07)_18px)] [mask-image:linear-gradient(to_bottom,transparent_0,#000_40%)]" />
              <div aria-hidden className="absolute left-1/2 top-[44%] h-6 w-6 -translate-x-1/2 rounded-full border border-white/30 bg-[#b6f400]/20 shadow-[0_0_24px_4px_rgb(182_244_0/0.35)]" />
            </div>
            {/* body grows with its content */}
            <div className="mx-[6%] -mt-px px-[5%] pb-10 pt-4" style={{ backgroundImage: "linear-gradient(180deg, #0b2219 0%, #061712 100%)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[clamp(1.2rem,1.7vw,1.6rem)] leading-[1.1] tracking-[-0.03em]">With Deccan your<br /><span className="text-white/60">monthly EMI is</span></p>
            </div>
            <div className="text-right">
              <p className="text-[clamp(2rem,3vw,2.8rem)] font-normal leading-none tracking-[-0.04em] tabular-nums">{formatInr(r.emi)}</p>
              <p className="mt-2 text-sm text-white/70">Loan: <span className="text-white">{formatInr(Math.round(r.loan))}</span></p>
            </div>
          </div>
          <div className="my-4 h-px bg-white/15" />
          <p className="text-[1rem] tracking-[-0.01em]">Your estimated cost, by category:</p>
          <dl className="mt-3 space-y-2.5 text-[0.98rem]">
            {[["Down payment", r.down, "(your share)"], ["Interest over the loan", r.interest, "(paid to the bank)"], ["Stamp duty & registration", r.duty, "(about 6%, Telangana)"]].map(([k, v, note]) => (
              <div key={k as string} className="flex items-baseline justify-between gap-4">
                <dt>{k} <span className="text-white/45">{note}</span></dt>
                <dd className="tabular-nums text-[1.1rem]">{formatInr(v as number)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-2xl bg-white/[0.07] p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <p className="max-w-[12rem] text-[1.15rem] leading-tight tracking-[-0.02em]">Want to see homes in this budget?</p>
              <Link href={`/listings?maxPrice=${Math.round(r.price)}&verified=1`} className="mono-label flex h-12 min-w-36 items-center justify-center rounded-lg bg-[#b6f400] px-6 text-black transition-transform hover:scale-[1.03] active:scale-95">Show verified homes</Link>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
     </CompoundFrame>
    </section>
  );
}
