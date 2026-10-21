# ADR-0005: Warm paper canvas, Inter type, single blue accent

- Status: accepted
- Date: 2026-10-21

## Context
The earlier navy/serif editorial look (ADR-0004) was replaced by a calmer, document-like system supplied by the product owner.

## Decision
Tokens live in `apps/web/src/app/globals.css` (Tailwind v4 `@theme`): warm `canvas-soft` page background with white cards, near-black `ink` text, one structural accent (`primary` blue) for CTAs and links, deep indigo `secondary` for the single hero band, and a sticker palette used only for decoration. Type is Inter with heavy, tightly tracked headings and 400-weight body. Marketing CTAs are pills, utility buttons 8px, cards 12px, inputs 4px. Elevation is hairlines plus layered near-transparent shadows. The split list-and-map search layout is unchanged; only the visual language moved.

## Alternatives considered
- Keep both themes behind a toggle: doubles the visual QA surface for no user value.

## Consequences
Token renames touched most components; new UI must use semantic tokens (`primary`, `ink-muted`, `hairline`), never raw hex. Map markers use the primary blue.

## Interview answer (30 seconds)
"Design tokens are semantic, so swapping the whole visual language was a token and component-chrome change, not a rewrite of layouts or data flow."
