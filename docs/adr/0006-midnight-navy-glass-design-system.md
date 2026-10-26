# ADR-0006: Midnight-navy design system

- Status: accepted (supersedes ADR-0004's visual language; the split list-and-map search layout is unchanged)
- Date: 2026-10-22

## Context
Product direction moved to a dark, cinematic travel-brand look: full-bleed video hero with a floating search panel, centre-peek carousels, two-weight headlines, rounded glass cards and a taupe accent panel.

## Decision
Tokens live in `apps/web/src/app/globals.css` (`bg`, `card`, `taupe`, `ink`, `body`, `muted`, `line`). Type is DM Sans (light headlines with one bold word). Interaction primitives are small and dependency-free: `Reveal` (IntersectionObserver fade-up), `SnapRow` (CSS scroll-snap with Prev/Next and a progress bar), `SearchPanel` (native selects that route to the URL-driven search page). All motion respects `prefers-reduced-motion`.

## Alternatives considered
- Carousel library (Embla/Swiper): more features, more weight; scroll-snap covers the need.

## Consequences
Inner pages inherit the dark tokens, so new UI must use semantic tokens, not raw colours. No testimonials, press logos or cookie banner are shown because there is no real data or tracking behind them.
