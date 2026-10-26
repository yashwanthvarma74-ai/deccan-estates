import { ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Listing } from "@/lib/api";
import { cn } from "@/lib/utils";

const LOOK = {
  VERIFIED: { label: "Verified", icon: ShieldCheck, cls: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40" },
  CAUTION: { label: "Check details", icon: TriangleAlert, cls: "bg-amber-400/15 text-amber-300 border-amber-400/40" },
  RISK: { label: "High risk", icon: ShieldAlert, cls: "bg-red-400/15 text-red-300 border-red-400/40" },
} as const;

/** Compact result of the pre-listing checks, shown on cards and the detail page. */
export function VerifyBadge({ report, className }: { report: Listing["verification"]; className?: string }) {
  if (!report) return null;
  const { label, icon: Icon, cls } = LOOK[report.status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium backdrop-blur", cls, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {label} · {report.score}
    </span>
  );
}
