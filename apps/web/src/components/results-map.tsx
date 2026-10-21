"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, List, Star } from "lucide-react";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import { PUBLIC_API_URL, fetchLocalities, fetchMapPoints, type ListingFilters } from "@/lib/api";
import { formatInr } from "@/lib/utils";

const HYDERABAD: [number, number] = [78.4867, 17.385];
const NAVY = "#0075de"; // primary blue

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
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
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
        m.addSource("listings", { type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: true, clusterRadius: 48, clusterMaxZoom: 14 });
        m.addSource("outline", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "outline-fill", type: "fill", source: "outline", paint: { "fill-color": NAVY, "fill-opacity": 0.06 } });
        m.addLayer({ id: "outline-hairline", type: "line", source: "outline", paint: { "line-color": NAVY, "line-width": 2 } });
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
          paint: { "circle-color": NAVY, "circle-radius": 8, "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
        });
        m.on("click", "clusters", async (e) => {
          const f = m.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
          const zoom = await (m.getSource("listings") as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id);
          m.easeTo({ center: (f.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom });
        });
        m.on("click", "point", (e) => {
          const f = e.features![0];
          const p = f.properties as { id: string; title: string; price: number };
          const card = document.getElementById(`listing-${p.id}`);
          new maplibregl.Popup({ offset: 12, closeButton: false })
            .setLngLat((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
            .setHTML(`<a href="/listings/${p.id}" style="color:#0d0d0d"><strong>${p.title.replace(/</g, "&lt;")}</strong><br>${formatInr(p.price)}</a>`)
            .addTo(m);
          card?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        for (const l of ["clusters", "point"]) {
          m.on("mouseenter", l, () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", l, () => (m.getCanvas().style.cursor = ""));
        }
        setReady(true);
      });
      mapRef.current = created;
    })();
    return () => {
      cancelled = true;
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
        properties: { id: p.id, title: p.title, price: p.priceInr },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    });
    if (points.data.length) {
      const lngs = points.data.map((p) => p.lng);
      const lats = points.data.map((p) => p.lat);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 13, duration: 600 });
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

  const btn = "label flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-hairline bg-white px-4 text-ink shadow-soft hover:bg-canvas-soft";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-hairline">
      <div ref={el} className="h-full w-full" role="region" aria-label="Map of matching listings" />
      <div className="absolute left-4 top-4 flex gap-2">
        {locality && (
          <button className={btn} onClick={() => setOutline(!outline)}>{outline ? "Remove outline" : "Show boundary"}</button>
        )}
      </div>
      <div className="absolute right-4 top-4 flex flex-col">
        <button aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-t-lg border border-hairline bg-white hover:bg-canvas-soft"><Plus className="h-5 w-5" /></button>
        <button aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-b-lg border border-t-0 border-hairline bg-white hover:bg-canvas-soft"><Minus className="h-5 w-5" /></button>
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
          <Star className="h-4 w-4 fill-primary text-primary" />{saved ? "Saved" : "Save search"}
        </button>
        <button className={btn} onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}>
          <List className="h-4 w-4" />List
        </button>
      </div>
    </div>
  );
}
