"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Uppercase filter button that opens a square dropdown panel; closes on outside click or Escape. */
export function Popover({
  label,
  active,
  children,
  align = "left",
}: {
  label: string;
  active?: boolean;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "label h-10 border px-4 transition-colors",
          active ? "border-navy bg-navy text-white" : "border-navy text-navy hover:bg-surface",
        )}
      >
        {label}
      </button>
      {open && (
        <div className={cn("absolute top-12 z-30 min-w-64 border border-line bg-white p-4 shadow-lg", align === "right" ? "right-0" : "left-0")}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
