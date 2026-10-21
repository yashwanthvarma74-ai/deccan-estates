"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn, formatInr } from "@/lib/utils";

export type HeroSlide = { id: string; slug: string; place: string; subtitle: string; price: number };

type Footage = { src: string; poster: string };

const DEFAULT_FOOTAGE: Footage = { src: "/videos/hero.mp4", poster: "/videos/hero-poster.jpg" };
/** Locality-specific footage: plays from the start when that locality's slide appears, and the slide holds until it ends. */
const LOCALITY_FOOTAGE: Record<string, Footage> = {
  kokapet: { src: "/videos/kokapet.mp4", poster: "/videos/kokapet-poster.jpg" },
};
const SLIDE_MS = 6000;
const FALLBACK_CLIP_SECONDS = 33;

/**
 * Full-width looping video with a rotating featured-listing caption, pause control and
 * progress bars. Falls back to the poster when the video is missing or motion is reduced.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [clipSeconds, setClipSeconds] = useState(FALLBACK_CLIP_SECONDS);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduce);
    setPaused(reduce);
  }, []);

  const slide = slides[index];
  const own = slide ? LOCALITY_FOOTAGE[slide.slug] : undefined;
  const footage = own ?? DEFAULT_FOOTAGE;
  const next = () => setIndex((i) => (i + 1) % slides.length);

  // Slides with their own footage advance when the clip ends; the rest use a timer.
  useEffect(() => {
    if (paused || slides.length < 2 || own) return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, slides.length, own]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => undefined);
  }, [paused]);

  const duration = own ? clipSeconds * 1000 : SLIDE_MS;

  return (
    <div className="mx-auto max-w-[1300px] px-6 py-10">
    <section className="relative isolate h-[min(68vh,640px)] min-h-[28rem] overflow-hidden rounded-2xl bg-secondary text-white shadow-soft" aria-roledescription="carousel" aria-label="Featured properties">
      <Image src={footage.poster} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
      {!failed && !reduced && (
        <video
          // Remount when the footage changes so a locality clip starts from 0:00.
          key={footage.src}
          ref={video}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          autoPlay muted loop={!own} playsInline preload="auto"
          onLoadedMetadata={(e) => own && setClipSeconds(Math.round(e.currentTarget.duration))}
          onEnded={() => own && next()}
          onError={() => setFailed(true)}
        >
          <source src={footage.src} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

      <div className="flex h-full flex-col px-8 pt-12 md:px-12">
        {slide && (
          <div key={slide.id} aria-live={paused ? "polite" : "off"}>
            <h2 className="text-5xl md:text-[64px] md:leading-none md:tracking-[-2.125px]">{slide.place}</h2>
            <p className="mt-6 text-xl font-semibold">
              {slide.subtitle} <span className="mx-2 text-white/60">•</span> {formatInr(slide.price)}
            </p>
            <Link href={`/listings/${slide.id}`} className="label mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-ink shadow-soft transition-transform hover:bg-canvas-soft active:scale-95">
              View listing <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>

      <button
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play slideshow" : "Pause slideshow"}
        className="absolute right-6 top-6 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/30 transition-transform hover:bg-black/40 active:scale-90"
      >
        {paused ? <Play className="h-5 w-5 fill-white" /> : <Pause className="h-5 w-5 fill-white" />}
      </button>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2" role="tablist" aria-label="Choose slide">
        {slides.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className="group h-6 w-16 cursor-pointer py-[10px]"
          >
            <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/40">
              <span
                key={`${index}-${paused}`}
                className={cn("absolute inset-y-0 left-0 bg-white", i < index && "w-full", i > index && "w-0")}
                style={i === index ? { width: paused ? "100%" : undefined, animation: paused ? undefined : `hero-progress ${duration}ms linear forwards` } : undefined}
              />
            </span>
          </button>
        ))}
      </div>
    </section>
    </div>
  );
}
