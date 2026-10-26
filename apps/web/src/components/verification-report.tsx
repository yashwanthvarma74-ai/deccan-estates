import { Check, CircleAlert, X } from "lucide-react";
import type { Listing } from "@/lib/api";
import { VerifyBadge } from "@/components/verify-badge";
import { cn } from "@/lib/utils";

const MARK = {
  PASS: { icon: Check, cls: "bg-emerald-400/15 text-emerald-300" },
  WARN: { icon: CircleAlert, cls: "bg-amber-400/15 text-amber-300" },
  FAIL: { icon: X, cls: "bg-red-400/15 text-red-300" },
} as const;

/** The full due-diligence report: every check with its source and a plain-language result. */
export function VerificationReport({ report, isPlot }: { report: NonNullable<Listing["verification"]>; isPlot: boolean }) {
  return (
    <section aria-labelledby="verify-title" className="mt-12 rounded-2xl border border-line bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label text-muted">{isPlot ? "Verified land report" : "Verified project report"}</p>
          <h2 id="verify-title" className="mt-2 text-2xl font-semibold">Checked before you see it</h2>
          <p className="mt-2 max-w-2xl text-muted">{report.summary}</p>
        </div>
        <div className="text-right">
          <VerifyBadge report={report} />
          <p className="mt-3 text-5xl font-semibold tabular-nums">{report.score}<span className="text-xl text-muted"> / 100</span></p>
        </div>
      </div>
      <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
        {report.checks.map((c) => {
          const { icon: Icon, cls } = MARK[c.result];
          return (
            <li key={c.key} className="grid grid-cols-[2rem_1fr] gap-4 py-4 xl:grid-cols-[2rem_15rem_minmax(0,1fr)_9rem]">
              <span className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-full", cls)}><Icon className="h-4 w-4" aria-label={c.result} /></span>
              <p className="font-medium">{c.label}</p>
              <p className="col-span-2 text-sm text-muted xl:col-span-1">{c.note}</p>
              <p className="col-span-2 text-xs uppercase tracking-wider text-muted xl:col-span-1 xl:text-right">{c.source}</p>
            </li>
          );
        })}
      </ul>
      {report.demo && (
        <p className="mt-6 text-xs text-muted">Sample data. These results are illustrative until live document checks are connected, so do not rely on them for a purchase.</p>
      )}
    </section>
  );
}
