"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const NAVY = "#070c26";

const style = {
  version: 8 as const,
  sources: { osm: { type: "raster" as const, tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
  layers: [{ id: "osm", type: "raster" as const, source: "osm", paint: { "raster-saturation": -0.45 } }],
};

function pin() {
  const el = document.createElement("div");
  el.style.cssText = `width:26px;height:26px;border-radius:9999px;background:${NAVY};border:3px solid #b6f400;box-shadow:0 2px 10px rgba(0,0,0,.5)`;
  return el;
}

function GoogleMap({ lat, lng, title, onFail }: { lat: number; lng: number; title: string; onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => onFail();
    (async () => {
      try {
        const { Map } = await loadGoogleMaps(GOOGLE_KEY!);
        if (cancelled || !box.current) return;
        const map = new Map(box.current, { center: { lat, lng }, zoom: 15, mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID", streetViewControl: false, mapTypeControl: true, clickableIcons: false });
        new google.maps.marker.AdvancedMarkerElement({ map, position: { lat, lng }, content: pin(), title });
      } catch { if (!cancelled) onFail(); }
    })();
    return () => { cancelled = true; };
  }, [lat, lng, title, onFail]);
  return <div ref={box} className="h-full w-full" role="region" aria-label="Map showing the property's location" />;
}

function OpenStreetMap({ lat, lng }: { lat: number; lng: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !box.current) return;
      map = new maplibregl.Map({ container: box.current, style, center: [lng, lat], zoom: 14.5, attributionControl: { compact: true } });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      new maplibregl.Marker({ element: pin() }).setLngLat([lng, lat]).addTo(map);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [lat, lng]);
  return <div ref={box} className="h-full w-full" role="region" aria-label="Map showing the property's location" />;
}

/** Where the home is, on a map, with links that open Google Maps for directions. Works without a Google key. */
export function LocationMap({ lat, lng, title, area }: { lat: number; lng: number; title: string; area: string }) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const fail = useCallback(() => setGoogleFailed(true), []);
  const link = "mono-label flex h-11 items-center gap-2 rounded-lg border border-white/25 px-5 text-white/90 transition-colors hover:border-[#b6f400] hover:text-white";
  return (
    <section aria-labelledby="location-h" className="mt-12">
      <h2 id="location-h" className="text-2xl">Location</h2>
      <p className="mt-2 text-sm text-muted">Approximate position in {area}, Hyderabad. The agent or owner shares the exact address when you get in touch.</p>
      <div className="mt-4 h-[22rem] overflow-hidden rounded-2xl border border-line bg-card sm:h-[26rem]">
        {GOOGLE_KEY && !googleFailed ? <GoogleMap lat={lat} lng={lng} title={title} onFail={fail} /> : <OpenStreetMap lat={lat} lng={lng} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <a className={link} target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}><MapPin className="h-4 w-4" /> Open in Google Maps</a>
        <a className={link} target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}><Navigation className="h-4 w-4" /> Get directions</a>
      </div>
    </section>
  );
}
