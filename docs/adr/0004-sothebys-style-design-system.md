# ADR-0004: Editorial split-view design system

- Status: superseded by ADR-0006
- Date: 2026-10-21

## Context
The product direction is a luxury-listing look: list and filters on the left, a live map on the right, navy and white, serif display type, small uppercase tracked labels, square corners.

## Decision
Tokens live in `apps/web/src/app/globals.css` (Tailwind v4 `@theme`): navy `#002349`, Source Serif 4 for headings, Libre Franklin for UI, `.label` for uppercase tracked text. Filter state lives in the URL; the list is server-rendered and cached, the map is a client component (MapLibre GL, clustered GeoJSON, OSM raster tiles) reading the same URL. We replicate layout and visual language only: no third-party logo, name, photography or copy.

## Alternatives considered
- Mapbox/Google Maps: better tiles but API keys and per-load cost.
- Client-side list filtering: loses shareable URLs and server caching.

## Consequences
OSM public tiles are for development only; production needs a tile provider. MapLibre 5 is used because v6's module worker does not bundle under Turbopack.
