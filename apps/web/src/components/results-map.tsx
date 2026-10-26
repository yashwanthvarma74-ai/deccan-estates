"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, List, Star } from "lucide-react";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import { PUBLIC_API_URL, fetchLocalities, fetchMapPoints, typeLabels, type Listing, type ListingFilters } from "@/lib/api";
import { priceLabel } from "@/lib/utils";

const HYDERABAD: [number, number] = [78.4867, 17.385];
const NAVY = "#070c26";

const style = {
  version: 8 as const,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm", paint: { "raster-saturation": -0.55, "raster-contrast": 0.05 } }],
};

function circle([lng, lat]: [number, number], km: number) {
  const pts = Array.from({ length: 65 }, (_, i) => {
    const a = (i / 64) * 2 * Math.PI;
    return [lng + (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a), lat + (km / 110.57) * Math.sin(a)];
  });
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [pts] } };
}

export function ResultsMap() {
  const sp = useSearchParams();
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  /** Where the matching homes are, and whether the person has moved the map themselves. */
  const bounds = useRef<[[number, number], [number, number]] | null>(null);
  const userMoved = useRef(false);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const [outline, setOutline] = useState(true);
  const [saved, setSaved] = useState(false);

  const filters: ListingFilters = Object.fromEntries(sp.entries());
  const points = useQuery({
    queryKey: ["map", filters],
    queryFn: () => fetchMapPoints(filters, PUBLIC_API_URL),
  });
  const localities = useQuery({ queryKey: ["localities"], queryFn: () => fetchLocalities(PUBLIC_API_URL) });
  const locality = localities.data?.find((l) => l.slug === sp.get("locality"));

  useEffect(() => {
    let map: MlMap | undefined;
    let cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !el.current) return;
      const created = new maplibregl.Map({ container: el.current, style, center: HYDERABAD, zoom: 10, attributionControl: { compact: true } });
      map = created;
      created.on("load", () => {
        const m = created;
        m.addSource("listings", { type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: true, clusterRadius: 38, clusterMaxZoom: 9 });
        m.addSource("outline", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "outline-fill", type: "fill", source: "outline", paint: { "fill-color": NAVY, "fill-opacity": 0.06 } });
        m.addLayer({ id: "outline-line", type: "line", source: "outline", paint: { "line-color": NAVY, "line-width": 2 } });
        m.addLayer({
          id: "clusters", type: "circle", source: "listings", filter: ["has", "point_count"],
          paint: { "circle-color": NAVY, "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 30], "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
        });
        m.addLayer({
          id: "cluster-count", type: "symbol", source: "listings", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Open Sans Semibold"], "text-size": 13 },
          paint: { "text-color": "#fff" },
        });
        m.addLayer({
          id: "point", type: "circle", source: "listings", filter: ["!", ["has", "point_count"]],
          paint: { "circle-color": NAVY, "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 6, 13, 10], "circle-stroke-color": "#b6f400", "circle-stroke-width": 2.5 },
        });
        m.on("click", "clusters", async (e) => {
          const f = m.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
          const zoom = await (m.getSource("listings") as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id);
          m.easeTo({ center: (f.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom });
        });
        const esc = (v: unknown) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
        // One card: hovering previews it, a click or tap pins it so it can be read and opened (also works on touch screens).
        const card = new maplibregl.Popup({ offset: 14, closeButton: false, closeOnClick: false, maxWidth: "260px", className: "map-card" });
        let shown = "";
        let pinned = false;
        const showCard = (f: { properties: Record<string, string | number>; geometry: unknown }) => {
          const p = f.properties;
          if (shown !== p.id) {
            shown = String(p.id);
            card
              .setLngLat((f.geometry as { coordinates: [number, number] }).coordinates)
              .setHTML(`<a href="/listings/${esc(p.id)}"><img src="${esc(p.image)}" alt="" /><span class="mc-body"><span class="mc-kind">${esc(p.kind)} · ${esc(p.locality)}</span><strong>${esc(p.title)}</strong><span class="mc-price">${priceLabel({ priceInr: Number(p.price), dealType: String(p.deal) })}</span><span class="mc-size">${esc(p.size)}</span><span class="mc-open">View details &rarr;</span></span></a>`)
              .addTo(m);
          }
        };
        const hideCard = () => { shown = ""; pinned = false; card.removeClassName("pinned"); card.remove(); document.querySelectorAll("[id^=listing-].ring-1").forEach((n) => n.classList.remove("ring-1", "ring-[#b6f400]")); };
        const lift = (id: unknown) => document.getElementById(`listing-${id}`)?.classList.add("ring-1", "ring-[#b6f400]");
        const hoverCard = (e: { features?: unknown[] }) => {
          if (pinned) return;
          const f = e.features![0] as Parameters<typeof showCard>[0];
          showCard(f);
          lift(f.properties.id);
        };
        m.on("mouseenter", "point", hoverCard);
        m.on("mousemove", "point", hoverCard);
        m.on("mouseleave", "point", () => { if (!pinned) hideCard(); });
        m.on("click", "point", (e) => {
          const f = e.features![0] as unknown as Parameters<typeof showCard>[0];
          shown = "";
          showCard(f);
          pinned = true;
          card.addClassName("pinned");
          lift(f.properties.id);
          document.getElementById(`listing-${f.properties.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        // Clicking empty map closes a pinned card.
        m.on("click", (e) => { if (!m.queryRenderedFeatures(e.point, { layers: ["point", "clusters"] }).length) hideCard(); });
        for (const l of ["clusters", "point"]) {
          m.on("mouseenter", l, () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", l, () => (m.getCanvas().style.cursor = ""));
        }
        setReady(true);
      });
      mapRef.current = created;
      // The map can be created before its box has a size; re-fit when it gets one, unless the person already moved the map.
      created.on("movestart", (e) => { if ((e as { originalEvent?: unknown }).originalEvent) userMoved.current = true; });
      const ro = new ResizeObserver(() => {
        created.resize();
        if (!userMoved.current && bounds.current) created.fitBounds(bounds.current, { padding: 60, maxZoom: 13, duration: 0 });
      });
      if (el.current) ro.observe(el.current);
      resizeObserver.current = ro;
    })();
    return () => {
      cancelled = true;
      resizeObserver.current?.disconnect();
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !points.data) return;
    (map.getSource("listings") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: points.data.map((p) => ({
        type: "Feature",
        properties: {
          id: p.id, title: p.title, price: p.priceInr, deal: p.dealType, image: p.imageUrl, locality: p.locality,
          kind: typeLabels[p.type as Listing["type"]] ?? p.type,
          size: p.type === "PLOT" ? `${p.plotAreaSqYd ?? Math.round(p.areaSqft / 9)} sq yd` : `${p.bedrooms ? `${p.bedrooms} BHK · ` : ""}${p.areaSqft.toLocaleString("en-IN")} sq ft`,
        },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    });
    if (points.data.length) {
      const lngs = points.data.map((p) => p.lng);
      const lats = points.data.map((p) => p.lat);
      bounds.current = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
      userMoved.current = false;
      map.fitBounds(bounds.current, { padding: 60, maxZoom: 13, duration: 600 });
    }
  }, [ready, points.data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("outline") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: locality && outline ? [circle([locality.lng, locality.lat], 3)] : [],
    });
  }, [ready, locality, outline]);

  const btn = "label flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-4 text-white shadow-lg hover:bg-card-hi";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-card">
      <div ref={el} className="h-full w-full" role="region" aria-label="Map of matching listings" />
      <div className="absolute left-4 top-4 flex gap-2">
        {locality && (
          <button className={btn} onClick={() => setOutline(!outline)}>{outline ? "Remove outline" : "Show boundary"}</button>
        )}
      </div>
      <div className="absolute right-4 top-4 flex flex-col">
        <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="flex h-10 w-10 cursor-pointer items-center justify-center border border-line bg-card text-white hover:bg-card-hi"><Plus className="h-5 w-5" /></button>
        <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="flex h-10 w-10 cursor-pointer items-center justify-center border border-t-0 border-line bg-card text-white hover:bg-card-hi"><Minus className="h-5 w-5" /></button>
      </div>
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
