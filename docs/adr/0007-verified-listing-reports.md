# ADR-0007: Verified listing reports

- Status: accepted (first slice; checks are simulated)
- Date: 2026-10-24

## Context
Hyderabad buyers, especially of plots, cannot easily tell whether a listing has an approved layout, a clean title, or sits in a lake buffer zone. Lawyers take days and charge per property. Trust before payment is the gap this product targets.

## Decision
Each listing has one `VerificationReport`: a status (Verified, Caution, Risk), a 0-100 score, a plain-language summary and a list of checks (layout approval, land-use zone, lake and buffer zones, chain of title, encumbrance, land record match, litigation for plots; RERA, sanctioned plan, occupancy, developer record for projects). The pure function `buildReport` produces it, so scoring is unit-tested. Cards show a badge, the detail page shows the full report, and search has a "Verified listings only" filter.

## Alternatives considered
- Checks computed at request time: slower and impossible to audit later; storing the report keeps a record of what was shown.
- A single pass/fail flag: hides which check failed, which is what buyers need.

## Consequences
Results are seeded sample data (`demo: true`) and the UI says so. The next slice is an upload-and-check flow: sellers upload deeds and certificates, the AI service extracts fields, and each check is filled from documents and public records instead of sample data.

## Interview answer (30 seconds)
"We turned due diligence into data: every listing carries a stored, scored report, so buyers see which check failed and sellers are incentivised to upload documents."
