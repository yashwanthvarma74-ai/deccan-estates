"use client";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { List, Star } from "lucide-react";
import { PUBLIC_API_URL, fetchLocalities, fetchMapPoints, type ListingFilters } from "@/lib/api";
import { loadGoogleMaps } from "@/lib/google-maps";
import { cardHtml } from "@/lib/map-card";

const HYDERABAD = { lat: 17.385, lng: 78.4867 };
const NAVY = "#070c26";

/** A round pin in the site's colors. */
function pin(size: number, label?: string) {
  const el = document.createElement("div");
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${NAVY};border:2.5px solid #b6f400;color:#fff;display:flex;align-items:center;justify-content:center;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.45);cursor:pointer`;
  if (label) el.textContent = label;
  return el;
}

/**
 * Results map on Google Maps: one pin per home, groups when zoomed out, a card on hover and a pinned card on click or tap.
 * Calls onFail when Google refuses to load (wrong key, billing off, blocked address) so the page can use the other map.
 */
export function GoogleResultsMap({ apiKey, onFail }: { apiKey: string; onFail: () => void }) {
  const sp = useSearchParams();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const info = useRef<google.maps.InfoWindow | null>(null);
  const clusterer = useRef<MarkerClusterer | null>(null);
  const circle = useRef<google.maps.Circle | null>(null);
  const bounds = useRef<google.maps.LatLngBounds | null>(null);
  const moved = useRef(false);
  const pinned = useRef(false);
  const [ready, setReady] = useState(false);
  const [outline, setOutline] = useState(true);
  const [saved, setSaved] = useState(false);

  const filters: ListingFilters = Object.fromEntries(sp.entries());
  const points = useQuery({ queryKey: ["map", filters], queryFn: () => fetchMapPoints(filters, PUBLIC_API_URL) });
  const localities = useQuery({ queryKey: ["localities"], queryFn: () => fetchLocalities(PUBLIC_API_URL) });
  const locality = localities.data?.find((l) => l.slug === sp.get("locality"));

  useEffect(() => {
    let cancelled = false;
    // Google calls this when the key is rejected after the script has loaded.
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => onFail();
    (async () => {
      try {
        const { Map, InfoWindow, Circle } = await loadGoogleMaps(apiKey);
        if (cancelled || !el.current) return;
        const m = new Map(el.current, {
          center: HYDERABAD, zoom: 10, mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
          gestureHandling: "greedy", streetViewControl: false, mapTypeControl: false, fullscreenControl: true, clickableIcons: false,
        });
        map.current = m;
        info.current = new InfoWindow({ headerDisabled: true, maxWidth: 270, disableAutoPan: false });
        circle.current = new Circle({ map: undefined, strokeColor: NAVY, strokeWeight: 2, fillColor: NAVY, fillOpacity: 0.06, clickable: false });
        m.addListener("dragstart", () => { moved.current = true; });
        m.addListener("click", () => { pinned.current = false; info.current?.close(); });
        setReady(true);
      } catch {
        if (!cancelled) onFail();
      }
    })();
    return () => { cancelled = true; clusterer.current?.clearMarkers(); info.current?.close(); circle.current?.setMap(null); map.current = null; setReady(false); };
  }, [apiKey, onFail]);

  // Pins for the matching homes.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m || !points.data) return;
    clusterer.current?.clearMarkers();
    const AdvancedMarker = google.maps.marker.AdvancedMarkerElement;
    const markers = points.data.map((p) => {
      const content = pin(22);
      const marker = new AdvancedMarker({ position: { lat: p.lat, lng: p.lng }, content, title: p.title });
      const show = () => { info.current?.setContent(cardHtml(p)); info.current?.open({ map: m, anchor: marker }); };
      content.addEventListener("mouseenter", () => { if (!pinned.current) show(); });
      content.addEventListener("mouseleave", () => { if (!pinned.current) info.current?.close(); });
      marker.addListener("click", () => {
        pinned.current = true;
        show();
        document.getElementById(`listing-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return marker;
    });
    clusterer.current = new MarkerClusterer({
      map: m, markers,
      renderer: { render: ({ count, position }) => new AdvancedMarker({ position, content: pin(count > 20 ? 52 : count > 8 ? 44 : 36, String(count)), zIndex: 1000 + count }) },
    });
    if (points.data.length) {
      const b = new google.maps.LatLngBounds();
      points.data.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
      bounds.current = b;
      moved.current = false;
      m.fitBounds(b, 60);
      google.maps.event.addListenerOnce(m, "idle", () => { if ((m.getZoom() ?? 0) > 13) m.setZoom(13); });
    }
  }, [ready, points.data]);

  // Re-fit when the box gets its real size, unless the person has already moved the map.
  useEffect(() => {
    if (!ready || !el.current) return;
    const ro = new ResizeObserver(() => { if (!moved.current && bounds.current && map.current) map.current.fitBounds(bounds.current, 60); });
    ro.observe(el.current);
    return () => ro.disconnect();
  }, [ready]);

  // Area outline.
  useEffect(() => {
    const c = circle.current;
    if (!ready || !c) return;
    if (locality && outline) { c.setCenter({ lat: locality.lat, lng: locality.lng }); c.setRadius(3000); c.setMap(map.current); } else c.setMap(null);
  }, [ready, locality, outline]);

  const btn = "label flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-4 text-white shadow-lg hover:bg-card-hi";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-card">
      <div ref={el} className="h-full w-full" role="region" aria-label="Map of matching listings" />
      {locality && (
        <div className="absolute left-4 top-4 flex gap-2">
          <button className={btn} onClick={() => setOutline(!outline)}>{outline ? "Remove outline" : "Show boundary"}</button>
        </div>
      )}
      <div className="absolute bottom-6 right-4 flex gap-2">
        <button
          className={btn}
          onClick={() => {
            try {
              const all = JSON.parse(localStorage.getItem("saved-searches") ?? "[]");
              localStorage.setItem("saved-searches", JSON.stringify([...all, sp.toString()]));
            } catch {}
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          <Star className="h-4 w-4 fill-white" />{saved ? "Saved" : "Save search"}
        </button>
        <button className={btn} onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}>
          <List className="h-4 w-4" />List
        </button>
      </div>
    </div>
  );
}
