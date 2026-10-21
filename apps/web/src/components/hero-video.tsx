"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/hero.mp4";

/**
 * Full-bleed looping background video. Falls back to the still image when the file is
 * missing, fails to load, or the visitor prefers reduced motion.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const showVideo = !failed && !reduced;

  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      <Image src="https://picsum.photos/seed/hyderabad-skyline/1920/900" alt="" fill priority sizes="100vw" className="object-cover" />
      {showVideo && (
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setFailed(true)}
        >
          <source src={VIDEO_SRC} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      )}
      <div className="absolute inset-0 bg-navy/55" />
    </div>
  );
}
