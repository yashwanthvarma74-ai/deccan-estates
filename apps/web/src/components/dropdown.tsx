"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Menu that opens when you point at it and closes when you move away, click elsewhere, press Esc or pick something.
 * On touch screens a tap opens and closes it. With `href`, a mouse click on the button also goes to that page.
 * (The old CSS-only version stayed open after a click because the button kept keyboard focus.)
 */
export function Dropdown({ trigger, buttonClassName, children, align = "left", chevron = true, href }: {
  trigger: ReactNode; buttonClassName: string; children: ReactNode; align?: "left" | "right"; chevron?: boolean; href?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const pointer = useRef("mouse");

  const openNow = () => { window.clearTimeout(timer.current); setOpen(true); };
  const closeSoon = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), 140); };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      root.current?.querySelector<HTMLElement>("button")?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", key); };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={() => { if (pointer.current === "mouse") openNow(); }}
      onMouseLeave={closeSoon}
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerDown={(e) => { pointer.current = e.pointerType || "mouse"; }}
        onClick={(e) => {
          const keyboard = e.detail === 0;
          if (!keyboard && pointer.current === "mouse") { if (href) { setOpen(false); router.push(href); } return; }
          setOpen((o) => !o);
        }}
        className={buttonClassName}
      >
        {trigger}
        {chevron && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />}
      </button>
      {open && (
        <div
          className={cn("absolute top-full z-20 pt-3", align === "right" ? "right-0" : "left-0")}
          onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a, button")) setOpen(false); }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
