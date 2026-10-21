"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn, formatInr } from "@/lib/utils";

export type HeroSlide = { id: string; place: string; subtitle: string; price: number };

const VIDEO_SRC = "/videos/hero.mp4";
const SLIDE_MS = 6000;

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

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduce);
    setPaused(reduce);
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, slides.length]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => undefined);
  }, [paused]);

  const slide = slides[index];

  return (
    <section className="relative isolate h-[calc(100vh-15rem)] min-h-[30rem] overflow-hidden bg-navy-deep text-white" aria-roledescription="carousel" aria-label="Featured properties">
      <Image src="/videos/hero-poster.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
      {!failed && !reduced && (
        <video
          ref={video}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          autoPlay muted loop playsInline preload="auto"
          onError={() => setFailed(true)}
        >
          <source src={VIDEO_SRC} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

      <div className="mx-auto flex h-full max-w-6xl flex-col px-6 pt-14">
        {slide && (
          <div key={slide.id} aria-live={paused ? "polite" : "off"}>
            <h2 className="font-display text-6xl md:text-7xl">{slide.place}</h2>
            <p className="font-display mt-8 text-2xl">
              {slide.subtitle} <span className="mx-2 text-gold">•</span> {formatInr(slide.price)}
            </p>
            <Link href={`/listings/${slide.id}`} className="label mt-2 inline-flex items-center gap-3 text-[0.8rem] hover:underline">
              View listing <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>

      <button
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play slideshow" : "Pause slideshow"}
        className="absolute right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] top-14 cursor-pointer"
      >
        {paused ? <Play className="h-6 w-6 fill-white" /> : <Pause className="h-6 w-6 fill-white" />}
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
            <span className="relative block h-[3px] w-full bg-white/40">
              <span
                key={`${index}-${paused}`}
                className={cn("absolute inset-y-0 left-0 bg-white", i < index && "w-full", i > index && "w-0")}
                style={i === index ? { width: paused ? "100%" : undefined, animation: paused ? undefined : `hero-progress ${SLIDE_MS}ms linear forwards` } : undefined}
              />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
