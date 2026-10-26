"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

/**
 * Listing photos: one large picture and two smaller ones. Clicking any of them opens a near full-screen viewer over a
 * blurred backdrop, with arrows, a counter, thumbnails, keyboard and swipe support. Clicking outside the photo closes it.
 */
export function PhotoGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const touchX = useRef<number | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const count = photos.length;

  const show = (i: number, from?: HTMLElement | null) => {
    opener.current = from ?? null;
    setOpen(i);
    requestAnimationFrame(() => setShown(true));
  };
  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => { setOpen(null); opener.current?.focus(); }, 160);
  }, []);
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + count) % count)), [count]);

  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    dialog.current?.focus();
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = overflow; };
  }, [open, close, go]);

  // Warm the next and previous photos so arrows feel instant.
  useEffect(() => {
    if (open === null) return;
    for (const d of [1, -1]) { const img = new window.Image(); img.src = photos[(open + d + count) % count]; }
  }, [open, photos, count]);

  const tile = "relative block overflow-hidden rounded-xl bg-white/5 focus-visible:outline-2 focus-visible:outline-[#b6f400]";
  const extra = photos.slice(1, 3);

  return (
    <>
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <button type="button" aria-label={`Open photo 1 of ${count}`} onClick={(e) => show(0, e.currentTarget)} className={`${tile} cursor-zoom-in`}>
          <Image src={photos[0]} alt={alt} width={1400} height={900} priority sizes="(min-width:768px) 66vw, 100vw" className="h-full max-h-[34rem] w-full object-cover transition-transform duration-500 hover:scale-[1.02]" />
        </button>
        <div className="hidden gap-2 md:grid">
          {extra.map((src, i) => (
            <button key={src} type="button" aria-label={`Open photo ${i + 2} of ${count}`} onClick={(e) => show(i + 1, e.currentTarget)} className={`${tile} cursor-zoom-in`}>
              <Image src={src} alt="" width={700} height={450} sizes="33vw" className="h-full max-h-[16.8rem] w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
              {i === extra.length - 1 && count > 3 && (
                <span className="mono-label absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-white"><Images className="h-4 w-4" /> +{count - 3} more</span>
              )}
            </button>
          ))}
        </div>
        {count > 1 && (
          <button type="button" onClick={(e) => show(0, e.currentTarget)} className="mono-label md:hidden flex h-11 items-center justify-center gap-2 rounded-lg border border-white/20 text-white/90">
            <Images className="h-4 w-4" /> View all {count} photos
          </button>
        )}
      </div>

      {open !== null && (
        <div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${open + 1} of ${count}: ${alt}`}
          tabIndex={-1}
          onClick={close}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 backdrop-blur-xl transition-opacity duration-150 outline-none ${shown ? "opacity-100" : "opacity-0"}`}
        >
          <button type="button" aria-label="Close photos" onClick={(e) => { e.stopPropagation(); close(); }} className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30">
            <X className="h-5 w-5" />
          </button>

          {count > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 sm:left-6">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 sm:right-6">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={open}
            src={photos[open]}
            alt={open === 0 ? alt : `${alt}, photo ${open + 1}`}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            className="max-h-[82vh] max-w-[94vw] select-none rounded-lg object-contain shadow-2xl"
          />

          <div onClick={(e) => e.stopPropagation()} className="mt-4 flex max-w-[94vw] flex-col items-center gap-3">
            <p className="mono-label text-white/80" aria-live="polite">{open + 1} / {count}</p>
            {count > 1 && (
              <ul className="flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
                {photos.map((src, i) => (
                  <li key={src} className="shrink-0">
                    <button type="button" aria-label={`Show photo ${i + 1}`} aria-current={i === open} onClick={() => setOpen(i)} className={`block h-12 w-16 cursor-pointer overflow-hidden rounded-md border-2 ${i === open ? "border-[#b6f400]" : "border-transparent opacity-60 hover:opacity-100"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
